import { PinoLogger } from 'nestjs-pino';
import { ChildProcess, fork } from 'child_process';
import * as path from 'path';

export interface PortScanResult {
  host: string;
  ports: number[];
}

export class NmapUtils {
  private readonly logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Get open port numbers for multiple hosts, processing them in batches using forked processes.
   * @param hosts - An array of host IP addresses or domain names.
   * @param batchSize - The number of hosts (forked processes) to run concurrently in each batch.
   */
  public async runNmapScanBatch(
    hosts: string[],
    batchSize = 5 // Adjust default batch size based on system resources (forking is heavier)
  ): Promise<PortScanResult[]> {
    const startTime = Date.now();
    this.logger.info(
      { hostCount: hosts.length, batchSize },
      'Starting port scan on multiple hosts in batches via fork' // Updated log message
    );

    try {
      const allResults: PortScanResult[] = [];
      for (let i = 0; i < hosts.length; i += batchSize) {
        const batchHosts = hosts.slice(i, i + batchSize);
        this.logger.info(
          { batchNumber: i / batchSize + 1, batchSize: batchHosts.length },
          `Processing batch via fork` // Updated log message
        );

        // Run nmap scan via fork for each host in the current batch in parallel
        const scanPromises = batchHosts.map(
          (host) => this.runNmapScanViaFork(host) // Use the fork method
        );
        const batchResults = await Promise.all(scanPromises);
        allResults.push(...batchResults);

        this.logger.info(
          {
            batchNumber: i / batchSize + 1,
            batchSize: batchHosts.length,
            resultsCount: batchResults.length,
          },
          `Completed batch via fork` // Updated log message
        );
      }

      // Calculate total time taken
      const totalTime = (Date.now() - startTime) / 1000; // in seconds

      this.logger.info(
        {
          hostCount: hosts.length,
          batchSize,
          timeElapsedSeconds: totalTime,
          totalPortsFound: allResults.reduce(
            (sum, result) => sum + result.ports.length,
            0
          ),
        },
        'Completed port scan on multiple hosts via fork' // Updated log message
      );

      return allResults;
    } catch (error) {
      const totalTime = (Date.now() - startTime) / 1000;

      this.logger.error(
        {
          error: error.message, // Log only message for brevity
          stack: error.stack, // Include stack
          hostCount: hosts.length,
          timeElapsedSeconds: totalTime,
        },
        'Error scanning multiple hosts via fork' // Updated log message
      );
      throw error;
    }
  }

  /**
   * Runs nmap using spawnSync within a forked child process for a single host.
   */
  private async runNmapScanViaFork(host: string): Promise<PortScanResult> {
    // --- IMPORTANT: Adjust the path to the compiled worker script ---
    const workerScriptPath = path.join(
      __dirname, // Assumes the worker JS is in the same dir as NmapUtils JS in dist
      'forks',
      'nmap.worker.js' // The compiled JavaScript file
    );
    // ---

    this.logger.debug(
      { host, workerScriptPath },
      'Preparing to run nmap via forked process'
    );

    return new Promise<PortScanResult>((resolve, reject) => {
      let child: ChildProcess | null = null;
      try {
        child = fork(workerScriptPath, [], {
          // silent: true, // Pipe child's stdout/stderr if needed for debugging
        });

        this.logger.debug(
          { pid: child.pid, host },
          'Forked nmap worker process'
        );

        let resultReceived = false;

        // Handle messages from the child process
        child.on('message', (message: any) => {
          resultReceived = true;
          this.logger.debug(
            { status: message?.status, host },
            'Received message from nmap worker'
          );
          if (message?.status === 'success') {
            resolve(message.result ?? { host, ports: [] }); // Ensure result exists
          } else if (message?.status === 'error') {
            const error = new Error(
              message.error?.message ?? `Unknown nmap worker error for ${host}`
            );
            error.stack = message.error?.stack;
            this.logger.error(
              { error: error.message, stack: error.stack, host },
              'Nmap worker reported error'
            );
            // Reject with an error that includes the host for context
            reject(new Error(`Nmap scan failed for ${host}: ${error.message}`));
          } else {
            this.logger.warn(
              { message, host },
              'Received unexpected message from nmap worker'
            );
            reject(
              new Error(
                `Received unexpected message from nmap worker for ${host}`
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
          this.logger.error(
            { error: error.message, host },
            'Nmap worker process error event'
          );
          reject(
            new Error(`Nmap worker process error for ${host}: ${error.message}`)
          );
        });

        // Handle child process exit
        child.on('exit', (code, signal) => {
          if (resultReceived) return;
          this.logger.warn(
            { code, signal, host },
            'Nmap worker process exited prematurely'
          );
          reject(
            new Error(
              `Nmap worker process for ${host} exited prematurely with code ${code}, signal ${signal}`
            )
          );
        });

        // Send the host to the child process
        this.logger.debug({ host }, 'Sending host to nmap worker process...');
        child.send({ host });
      } catch (forkError) {
        this.logger.error(
          { error: forkError.message, host },
          'Failed to fork nmap worker process'
        );
        reject(
          new Error(
            `Failed to fork nmap worker for ${host}: ${forkError.message}`
          )
        );
      }
    });
  }
}
