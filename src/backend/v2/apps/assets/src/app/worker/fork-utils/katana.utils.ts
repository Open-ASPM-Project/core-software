import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export class KatanaUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Run katana worker to scan web applications and return metadata
   */
  async runKatanaWorker(
    webappUrls: string[],
    crawlerConfig?: any,
    formConfig?: any,
    fieldConfig?: any,
    headers?: { Authorization?: string; Cookie?: string }
  ): Promise<string> {
    if (!webappUrls || webappUrls.length === 0) {
      throw new BadRequestException(
        'No web application URLs provided for katana scan'
      );
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    // Path to the katana worker script
    const workerScriptPath = path.join(__dirname, 'forks', 'katana.worker.js');

    // Prepare the data to send to the worker
    const workerData = {
      webappUrls,
      crawlerConfig,
      fieldConfig,
      formConfig,
      headers,
      requestId,
    };

    return new Promise<string>((resolve, reject) => {
      let child: ChildProcess | null = null;

      try {
        child = fork(workerScriptPath, [], {
          // silent: true, // Uncomment to pipe child's stdout/stderr if needed
        });

        this.logger.debug(
          { pid: child.pid, requestId },
          `Forked katana worker process`
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
            `Received message from katana worker`
          );

          if (message?.status === 'success') {
            this.logger.info(
              {
                duration,
                requestId,
              },
              `Katana scan completed successfully`
            );
            resolve(message.metadata?.responseDir);
          } else if (message?.status === 'error') {
            const error = new Error(
              message.error?.message ?? `Unknown katana worker error`
            );
            error.stack = message.error?.stack;
            this.logger.error(
              {
                error: error.message,
                stack: error.stack,
                duration,
                requestId,
              },
              `Katana worker reported an error`
            );
            reject(new Error(`Katana scan failed: ${error.message}`));
          } else if (message?.status === 'ready') {
            this.logger.debug(
              { requestId },
              `Katana worker ready, sending web application URLs`
            );
            child?.send(workerData);
          } else {
            this.logger.warn(
              {
                message,
                duration,
                requestId,
              },
              `Received unexpected message from katana worker`
            );
            reject(new Error(`Received unexpected message from katana worker`));
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
            `Katana worker process error event`
          );

          reject(new Error(`Katana worker process error: ${error.message}`));
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
            `Katana worker process exited prematurely`
          );

          reject(
            new Error(
              `Katana worker process exited prematurely with code ${code}, signal ${signal}`
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
          `Failed to fork katana worker process`
        );

        reject(new Error(`Failed to fork katana worker: ${forkError.message}`));
      }
    });
  }
}
