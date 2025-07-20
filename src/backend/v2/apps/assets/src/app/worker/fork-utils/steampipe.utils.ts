import { CloudType, AwsServiceAssetType } from '@firewall-backend/enums';
import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Source } from '@firewall-backend/entities';

export class SteampipeUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Generic method to run steampipe worker for any resource type
   */
  async runSteampipeWorker(resourceType: AwsServiceAssetType, source: Source) {
    this.logger.info(
      { sourceUuid: source.uuid, cloudType: source.cloudType, resourceType },
      `Starting steampipe ${resourceType} scan via fork`
    );

    if (source.cloudType !== CloudType.AWS) {
      throw new BadRequestException(
        `${resourceType} discovery only supports AWS cloud type`
      );
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    // Path to the unified worker script
    const workerScriptPath = path.join(
      __dirname,
      'forks',
      'steampipe-export-aws.worker.js'
    );

    // Prepare the data to send to the worker
    const workerData = {
      credentials: {
        accessKey: source.awsAccessKey,
        secretKey: source.awsSecretKey,
      },
      requestId,
      resourceType,
    };

    // Validate credentials before forking
    this.validateCredentials(source);

    return new Promise<any[]>((resolve, reject) => {
      let child: ChildProcess | null = null;

      try {
        child = fork(workerScriptPath, [], {
          // silent: true, // Uncomment to pipe child's stdout/stderr if needed
        });

        this.logger.debug(
          { pid: child.pid, sourceUuid: source.uuid, requestId, resourceType },
          `Forked steampipe worker process for ${resourceType}`
        );

        let resultReceived = false;

        // Handle messages from the child process
        child.on('message', (message: any) => {
          resultReceived = true;
          const duration = (Date.now() - startTime) / 1000;

          this.logger.debug(
            {
              status: message?.status,
              sourceUuid: source.uuid,
              duration,
              requestId,
              resourceType,
            },
            `Received message from steampipe worker for ${resourceType}`
          );

          if (message?.status === 'success') {
            this.logger.info(
              {
                sourceUuid: source.uuid,
                count: message.data?.length ?? 0,
                duration,
                requestId,
                resourceType,
                ...message.metadata,
              },
              `Steampipe ${resourceType} scan via fork successful`
            );
            resolve(message.data ?? []);
          } else if (message?.status === 'error') {
            const error = new Error(
              message.error?.message ??
                `Unknown steampipe worker error for ${source.uuid}`
            );
            error.stack = message.error?.stack;
            this.logger.error(
              {
                error: error.message,
                stack: error.stack,
                sourceUuid: source.uuid,
                duration,
                requestId,
                resourceType,
              },
              `Steampipe worker reported error for ${resourceType}`
            );
            reject(
              new Error(
                `Steampipe ${resourceType} scan failed for source ${source.uuid}: ${error.message}`
              )
            );
          } else if (message?.status === 'ready') {
            this.logger.debug(
              { sourceUuid: source.uuid, requestId, resourceType },
              `Steampipe worker ready, sending credentials for ${resourceType}`
            );
            child?.send(workerData);
          } else {
            this.logger.warn(
              {
                message,
                sourceUuid: source.uuid,
                duration,
                requestId,
                resourceType,
              },
              `Received unexpected message from steampipe worker for ${resourceType}`
            );
            reject(
              new Error(
                `Received unexpected message from steampipe worker for ${resourceType} for source ${source.uuid}`
              )
            );
          }

          // Kill the worker if we have a final result
          if (
            (message?.status === 'success' || message?.status === 'error') &&
            child &&
            !child.killed
          ) {
            child.kill();
          }
        });

        // Handle errors related to the child process itself
        child.on('error', (error) => {
          if (resultReceived) return;

          const duration = (Date.now() - startTime) / 1000;
          this.logger.error(
            {
              error: error.message,
              sourceUuid: source.uuid,
              duration,
              requestId,
              resourceType,
            },
            `Steampipe worker process error event for ${resourceType}`
          );

          reject(
            new Error(
              `Steampipe worker process error for ${resourceType} for source ${source.uuid}: ${error.message}`
            )
          );
        });

        // Handle child process exit
        child.on('exit', (code, signal) => {
          if (resultReceived) return;

          const duration = (Date.now() - startTime) / 1000;
          this.logger.warn(
            {
              code,
              signal,
              sourceUuid: source.uuid,
              duration,
              requestId,
              resourceType,
            },
            `Steampipe worker process exited prematurely for ${resourceType}`
          );

          reject(
            new Error(
              `Steampipe worker process for ${resourceType} for source ${source.uuid} exited prematurely with code ${code}, signal ${signal}`
            )
          );
        });
      } catch (forkError) {
        const duration = (Date.now() - startTime) / 1000;

        this.logger.error(
          {
            error: forkError.message,
            sourceUuid: source.uuid,
            duration,
            requestId,
            resourceType,
          },
          `Failed to fork steampipe worker process for ${resourceType}`
        );

        reject(
          new Error(
            `Failed to fork steampipe worker for ${resourceType} for source ${source.uuid}: ${forkError.message}`
          )
        );
      }
    });
  }

  /**
   * Run multiple steampipe commands to discover various AWS resources.
   */
  async discoverAwsResources(source: Source) {
    if (source.cloudType !== CloudType.AWS) {
      throw new BadRequestException(
        'Resource discovery only supports AWS cloud type'
      );
    }

    this.logger.info(
      { sourceUuid: source.uuid },
      'Starting comprehensive AWS resource discovery'
    );

    // Fetch multiple resource types in parallel
    const resourceKeys = Object.values(AwsServiceAssetType);
    const promises = [];
    for (const resourceKey of resourceKeys) {
      promises.push(this.runSteampipeWorker(resourceKey, source));
    }
    const results = await Promise.all(promises);
    const resources: any = {};
    const resourceCounts = {};
    for (let i = 0; i < resourceKeys.length; i++) {
      resources[resourceKeys[i]] = results[i];
      resourceCounts[resourceKeys[i]] = results[i].length;
    }

    this.logger.info(
      {
        sourceUuid: source.uuid,
        resourceCounts,
      },
      'AWS resource discovery complete'
    );

    return resources;
  }

  /**
   * Validate AWS credentials.
   */
  private validateCredentials(source: Source): void {
    if (source.cloudType !== CloudType.AWS) {
      throw new BadRequestException(
        'This operation only supports AWS cloud type'
      );
    }

    if (!source.awsAccessKey || !source.awsSecretKey) {
      this.logger.error({ sourceUuid: source.uuid }, 'Missing AWS credentials');
      throw new BadRequestException('Missing AWS credentials');
    }

    this.logger.debug(
      { sourceUuid: source.uuid },
      'AWS credentials validated successfully'
    );
  }
}
