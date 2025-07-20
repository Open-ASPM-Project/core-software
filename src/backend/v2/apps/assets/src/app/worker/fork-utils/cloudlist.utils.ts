import { CloudType } from '@firewall-backend/enums';
import { fork, ChildProcess } from 'child_process'; // Add fork, ChildProcess
import * as path from 'path';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import { Source } from '@firewall-backend/entities';

export class CloudlistUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Run cloudlist command to discover assets using a forked process.
   */
  async runCloudList(source: Source): Promise<string[]> {
    this.logger.info(
      { sourceUuid: source.uuid, cloudType: source.cloudType },
      'Starting cloudlist scan via fork'
    );
    const startTime = Date.now();

    // --- IMPORTANT: Adjust the path to the compiled worker script ---
    const workerScriptPath = path.join(
      __dirname, // Assumes the worker JS is in the same dir as CloudlistUtils JS in dist
      'forks',
      'cloudlist.worker.js' // The compiled JavaScript file
    );
    // ---

    // Prepare the data to send to the worker (only necessary fields)
    const workerSourceData: Partial<Source> = {
      uuid: source.uuid,
      cloudType: source.cloudType,
      awsAccessKey: source.awsAccessKey,
      awsSecretKey: source.awsSecretKey,
      gcpServiceAccountKey: source.gcpServiceAccountKey,
      clientId: source.clientId,
      clientSecret: source.clientSecret,
      tenantId: source.tenantId,
      subscriptionId: source.subscriptionId,
      digitaloceanToken: source.digitaloceanToken,
      scalewayAccessKey: source.scalewayAccessKey,
      scalewayAccessToken: source.scalewayAccessToken,
      apiKey: source.apiKey,
      email: source.email,
      herokuApiToken: source.herokuApiToken,
      fastlyApiKey: source.fastlyApiKey,
      linodePersonalAccessToken: source.linodePersonalAccessToken,
      namecheapApiKey: source.namecheapApiKey,
      namecheapUserName: source.namecheapUserName,
      alibabaAccessKey: source.alibabaAccessKey,
      alibabaAccessKeySecret: source.alibabaAccessKeySecret,
      alibabaRegionId: source.alibabaRegionId,
      tfStateFile: source.tfStateFile,
      consulUrl: source.consulUrl,
      nomadUrl: source.nomadUrl,
      authToken: source.authToken,
      kubeconfigFile: source.kubeconfigFile,
      kubeconfigEncoded: source.kubeconfigEncoded,
      dnssimpleApiToken: source.dnssimpleApiToken,
    };

    // Perform credential validation *before* forking
    this.validateCredentials(workerSourceData); // Use the prepared data

    return new Promise<string[]>((resolve, reject) => {
      let child: ChildProcess | null = null;
      try {
        child = fork(workerScriptPath, [], {
          // silent: true, // Pipe child's stdout/stderr if needed
        });

        this.logger.debug(
          { pid: child.pid, sourceUuid: source.uuid },
          'Forked cloudlist worker process'
        );

        let resultReceived = false;

        // Handle messages from the child process
        child.on('message', (message: any) => {
          resultReceived = true;
          const duration = (Date.now() - startTime) / 1000;
          this.logger.debug(
            { status: message?.status, sourceUuid: source.uuid, duration },
            'Received message from cloudlist worker'
          );

          if (message?.status === 'success') {
            this.logger.info(
              {
                sourceUuid: source.uuid,
                count: message.results?.length ?? 0,
                duration,
              },
              'Cloudlist scan via fork successful'
            );
            resolve(message.results ?? []);
          } else if (message?.status === 'error') {
            const error = new Error(
              message.error?.message ??
                `Unknown cloudlist worker error for ${source.uuid}`
            );
            error.stack = message.error?.stack;
            this.logger.error(
              {
                error: error.message,
                stack: error.stack,
                sourceUuid: source.uuid,
                duration,
              },
              'Cloudlist worker reported error'
            );
            // Reject with a more specific error
            reject(
              new Error(
                `Cloudlist scan failed for source ${source.uuid}: ${error.message}`
              )
            );
          } else {
            this.logger.warn(
              { message, sourceUuid: source.uuid, duration },
              'Received unexpected message from cloudlist worker'
            );
            reject(
              new Error(
                `Received unexpected message from cloudlist worker for source ${source.uuid}`
              )
            );
          }
          if (child && !child.killed) {
            child.kill();
          }
        });

        // Handle errors related to the child process itself
        child.on('error', (error) => {
          if (resultReceived) return;
          const duration = (Date.now() - startTime) / 1000;
          this.logger.error(
            { error: error.message, sourceUuid: source.uuid, duration },
            'Cloudlist worker process error event'
          );
          reject(
            new Error(
              `Cloudlist worker process error for source ${source.uuid}: ${error.message}`
            )
          );
        });

        // Handle child process exit
        child.on('exit', (code, signal) => {
          if (resultReceived) return;
          const duration = (Date.now() - startTime) / 1000;
          this.logger.warn(
            { code, signal, sourceUuid: source.uuid, duration },
            'Cloudlist worker process exited prematurely'
          );
          reject(
            new Error(
              `Cloudlist worker process for source ${source.uuid} exited prematurely with code ${code}, signal ${signal}`
            )
          );
        });

        // Send the source data to the child process
        this.logger.debug(
          { sourceUuid: source.uuid },
          'Sending source data to cloudlist worker process...'
        );
        child.send({ source: workerSourceData }); // Send the prepared data
      } catch (forkError) {
        const duration = (Date.now() - startTime) / 1000;
        this.logger.error(
          { error: forkError.message, sourceUuid: source.uuid, duration },
          'Failed to fork cloudlist worker process'
        );
        reject(
          new Error(
            `Failed to fork cloudlist worker for source ${source.uuid}: ${forkError.message}`
          )
        );
      }
    });
  }

  // Keep the credential validation logic (now accepts WorkerSource)
  private validateCredentials(source: Partial<Source>): void {
    let missingCredentials = false;
    switch (source.cloudType) {
      case CloudType.AWS:
        if (!source.awsAccessKey || !source.awsSecretKey)
          missingCredentials = true;
        break;
      case CloudType.GCP:
        if (!source.gcpServiceAccountKey) missingCredentials = true;
        break;
      case CloudType.AZURE:
        if (
          !source.clientId ||
          !source.clientSecret ||
          !source.tenantId ||
          !source.subscriptionId
        )
          missingCredentials = true;
        break;
      case CloudType.DIGITAL_OCEAN:
        if (!source.digitaloceanToken) missingCredentials = true;
        break;
      case CloudType.SCALEWAY:
        if (!source.scalewayAccessKey || !source.scalewayAccessToken)
          missingCredentials = true;
        break;
      case CloudType.ARVANCLOUD:
        if (!source.apiKey) missingCredentials = true;
        break;
      case CloudType.CLOUDFLARE:
        if (!source.email || !source.apiKey) missingCredentials = true;
        break;
      case CloudType.HEROKU:
        if (!source.herokuApiToken) missingCredentials = true;
        break;
      case CloudType.FASTLY:
        if (!source.fastlyApiKey) missingCredentials = true;
        break;
      case CloudType.LINODE:
        if (!source.linodePersonalAccessToken) missingCredentials = true;
        break;
      case CloudType.NAMECHEAP:
        if (!source.namecheapApiKey || !source.namecheapUserName)
          missingCredentials = true;
        break;
      case CloudType.ALIBABA:
        if (
          !source.alibabaAccessKey ||
          !source.alibabaAccessKeySecret ||
          !source.alibabaRegionId
        )
          missingCredentials = true;
        break;
      case CloudType.TERRAFORM:
        if (!source.tfStateFile) missingCredentials = true;
        break;
      case CloudType.HASHICORP_CONSUL:
        if (!source.consulUrl) missingCredentials = true;
        break;
      case CloudType.HASHICORP_NOMAD:
        if (!source.nomadUrl) missingCredentials = true;
        break;
      case CloudType.HETZNER:
        if (!source.authToken) missingCredentials = true;
        break;
      case CloudType.KUBERNETES:
        // Allow either kubeconfigFile or kubeconfigEncoded
        if (!source.kubeconfigFile && !source.kubeconfigEncoded)
          missingCredentials = true;
        break;
      case CloudType.DNSSIMPLE:
        if (!source.dnssimpleApiToken) missingCredentials = true;
        break;
      default:
        // This case should ideally be caught by enum validation earlier
        throw new BadRequestException(
          `Unsupported cloud type: ${source.cloudType}`
        );
    }

    if (missingCredentials) {
      this.logger.error(
        { sourceUuid: source.uuid, cloudType: source.cloudType },
        `Missing credentials for ${source.cloudType}`
      );
      throw new BadRequestException(
        `Missing credentials for ${source.cloudType}`
      );
    }
    this.logger.debug(
      { sourceUuid: source.uuid },
      'Credentials validated successfully'
    );
  }

  // createProviderConfigFile is now internal to the worker
}
