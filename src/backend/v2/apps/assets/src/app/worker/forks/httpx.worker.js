const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

console.log('[HttpxWorker] Worker started');

// Listen for messages from the parent process
process.on('message', async (message) => {
  console.log('[HttpxWorker] Received message from parent process');
  let tempFile = null;

  try {
    if (!message || !message.hosts) {
      console.error('[HttpxWorker] No hosts received');
      throw new Error('No hosts received');
    }

    const { hosts, requestId = crypto.randomUUID().substring(0, 8) } = message;

    console.log(`[HttpxWorker] [${requestId}] Processing httpx scan request`);

    // Create a temporary file to store hosts
    tempFile = path.join(os.tmpdir(), `httpx-hosts-${requestId}.txt`);
    fs.writeFileSync(tempFile, hosts.join('\n'), 'utf8');

    console.log(
      `[HttpxWorker] [${requestId}] Created temporary file at ${tempFile}`
    );

    // Execute the httpx command
    console.log(`[HttpxWorker] [${requestId}] Executing httpx scan command`);
    const startTime = Date.now();

    const result = spawnSync(
      'httpx',
      [
        '-l',
        tempFile,
        '-json',
        '-silent',
        '-timeout',
        '10',
        '-threads',
        '500',
        '-retries',
        '1',
      ],
      {
        encoding: 'utf8',
        timeout: 300000, // 5-minute timeout
        maxBuffer: 100 * 1024 * 1024, // 100 MB buffer
      }
    );

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(
      `[HttpxWorker] [${requestId}] Command execution completed in ${executionTime.toFixed(
        2
      )}s`
    );

    // Clean up the temporary file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`[HttpxWorker] [${requestId}] Removed temporary file`);
    }

    // Check for errors
    if (result.error) {
      console.error(
        `[HttpxWorker] [${requestId}] Error executing httpx: ${result.error.message}`
      );
      throw new Error(`Error executing httpx: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(
        `[HttpxWorker] [${requestId}] httpx exited with status ${result.status}`
      );
      console.error(`[HttpxWorker] [${requestId}] stderr: ${result.stderr}`);
      throw new Error(
        `httpx exited with status ${result.status}: ${result.stderr}`
      );
    }

    console.log(
      `[HttpxWorker] [${requestId}] httpx scan completed successfully`
    );

    // Parse the JSON output
    const processedResults = (result.stdout || '')
      .split(os.EOL)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const json = JSON.parse(line);
          return json.url || line;
        } catch (parseError) {
          console.warn(
            `[HttpxWorker] [${requestId}] Failed to parse line: ${parseError.message}`
          );
          return null;
        }
      })
      .filter((result) => result !== null);

    console.log(
      `[HttpxWorker] [${requestId}] Processed ${processedResults.length} results.`
    );

    // Send the result back to the parent process
    process.send({
      status: 'success',
      metadata: {
        executionTime,
        requestId,
        results: processedResults,
      },
    });

    console.log(`[HttpxWorker] [${requestId}] Request processing complete`);
  } catch (error) {
    const requestId = message?.requestId || 'unknown';

    console.error(`[HttpxWorker] [${requestId}] Error in worker:`, error);
    console.error(`[HttpxWorker] [${requestId}] Stack trace:`, error.stack);

    // Clean up the temporary file if it exists
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(
        `[HttpxWorker] [${requestId}] Removed temporary file after error`
      );
    }

    // Send error back to parent process
    process.send({
      status: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name,
      },
      requestId,
    });

    console.log(
      `[HttpxWorker] [${requestId}] Error notification sent to parent`
    );
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log(
    '[HttpxWorker] Received SIGTERM signal. Shutting down gracefully.'
  );
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(
    '[HttpxWorker] Received SIGINT signal. Shutting down gracefully.'
  );
  process.exit(0);
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[HttpxWorker] Disconnected from parent process. Exiting.');
  process.exit(1);
});

// Notify parent that worker is ready
console.log('[HttpxWorker] Worker initialized and ready to process requests');
process.send({ status: 'ready' });
