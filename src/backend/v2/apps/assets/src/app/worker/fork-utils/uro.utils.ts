import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export class UroUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Run uro worker to process URLs and return metadata
   */
  async runUroWorker(urls: string[]): Promise<string> {
    if (!urls || urls.length === 0) {
      throw new BadRequestException('No URLs provided for uro processing');
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID().substring(0, 8);

    // Path to the uro worker script
    const workerScriptPath = path.join(__dirname, 'forks', 'uro.worker.js');

    // Prepare the data to send to the worker
    const workerData = {
      urls,
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
          `Forked uro worker process`
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
            `Received message from uro worker`
          );

          if (message?.status === 'success') {
            this.logger.info(
              {
                duration,
                requestId,
              },
              `Uro processing completed successfully`
            );
            resolve(message.metadata?.outputFile);
          } else if (message?.status === 'error') {
            const error = new Error(
              message.error?.message ?? `Unknown uro worker error`
            );
            error.stack = message.error?.stack;
            this.logger.error(
              {
                error: error.message,
                stack: error.stack,
                duration,
                requestId,
              },
              `Uro worker reported an error`
            );
            reject(new Error(`Uro processing failed: ${error.message}`));
          } else if (message?.status === 'ready') {
            this.logger.debug({ requestId }, `Uro worker ready, sending URLs`);
            child?.send(workerData);
          } else {
            this.logger.warn(
              {
                message,
                duration,
                requestId,
              },
              `Received unexpected message from uro worker`
            );
            reject(new Error(`Received unexpected message from uro worker`));
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
            `Uro worker process error event`
          );

          reject(new Error(`Uro worker process error: ${error.message}`));
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
            `Uro worker process exited prematurely`
          );

          reject(
            new Error(
              `Uro worker process exited prematurely with code ${code}, signal ${signal}`
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
          `Failed to fork uro worker process`
        );

        reject(new Error(`Failed to fork uro worker: ${forkError.message}`));
      }
    });
  }
}
