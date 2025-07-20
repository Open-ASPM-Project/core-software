import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export class GowitnessUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Run gowitness worker to scan assets and return screenshot paths
   */
  async runGowitnessWorker(
    assetUrls: string[]
  ): Promise<{ path: string; metadata: string }[]> {
    if (!assetUrls || assetUrls.length === 0) {
      throw new BadRequestException(
        'No asset URLs provided for gowitness scan'
      );
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    // Path to the gowitness worker script
    const workerScriptPath = path.join(
      __dirname,
      'forks',
      'gowitness.worker.js'
    );

    // Prepare the data to send to the worker
    const workerData = {
      assetUrls,
      requestId,
    };

    return new Promise<{ path: string; metadata: string }[]>(
      (resolve, reject) => {
        let child: ChildProcess | null = null;

        try {
          child = fork(workerScriptPath, [], {
            // silent: true, // Uncomment to pipe child's stdout/stderr if needed
          });

          this.logger.debug(
            { pid: child.pid, requestId },
            `Forked gowitness worker process`
          );

          let resultReceived = false;

          // Handle messages from the child process
          child.on('message', (message: any) => {
            resultReceived = true;
            const duration = (Date.now() - startTime) / 1000;

            this.logger.debug(
              {
                status: message?.status,
                duration,
                requestId,
              },
              `Received message from gowitness worker`
            );

            if (message?.status === 'success') {
              this.logger.info(
                {
                  duration,
                  requestId,
                },
                `Gowitness scan completed successfully`
              );
              resolve(message.metadata?.screenshots ?? []);
            } else if (message?.status === 'error') {
              const error = new Error(
                message.error?.message ?? `Unknown gowitness worker error`
              );
              error.stack = message.error?.stack;
              this.logger.error(
                {
                  error: error.message,
                  stack: error.stack,
                  duration,
                  requestId,
                },
                `Gowitness worker reported an error`
              );
              reject(new Error(`Gowitness scan failed: ${error.message}`));
            } else if (message?.status === 'ready') {
              this.logger.debug(
                { requestId },
                `Gowitness worker ready, sending asset URLs`
              );
              child?.send(workerData);
            } else {
              this.logger.warn(
                {
                  message,
                  duration,
                  requestId,
                },
                `Received unexpected message from gowitness worker`
              );
              reject(
                new Error(`Received unexpected message from gowitness worker`)
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
                duration,
                requestId,
              },
              `Gowitness worker process error event`
            );

            reject(
              new Error(`Gowitness worker process error: ${error.message}`)
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
                duration,
                requestId,
              },
              `Gowitness worker process exited prematurely`
            );

            reject(
              new Error(
                `Gowitness worker process exited prematurely with code ${code}, signal ${signal}`
              )
            );
          });
        } catch (forkError) {
          const duration = (Date.now() - startTime) / 1000;

          this.logger.error(
            {
              error: forkError.message,
              duration,
              requestId,
            },
            `Failed to fork gowitness worker process`
          );

          reject(
            new Error(`Failed to fork gowitness worker: ${forkError.message}`)
          );
        }
      }
    );
  }
}
