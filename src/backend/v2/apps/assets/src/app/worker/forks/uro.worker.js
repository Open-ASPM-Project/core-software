const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

console.log('[UroWorker] Worker started');

// Listen for messages from the parent process
process.on('message', async (message) => {
  console.log('[UroWorker] Received message from parent process');
  let tempInputFile = null;

  const { requestId = crypto.randomUUID().substring(0, 8) } = message;

  try {
    if (!message || !message.urls) {
      console.error('[UroWorker] Invalid message received');
      throw new Error('Invalid message received');
    }

    const { urls } = message;

    console.log(`[UroWorker] [${requestId}] Processing uro request`);

    // Create a temporary file to store the list of URLs
    tempInputFile = path.join(os.tmpdir(), `uro-input-${requestId}.txt`);
    fs.writeFileSync(tempInputFile, urls.join('\n'), 'utf8');
    console.log(
      `[UroWorker] [${requestId}] Created temporary input file: ${tempInputFile}`
    );

    // Prepare the output file path
    const outputFile = path.join(
      process.cwd(),
      'uro_output',
      `uro-output-${requestId}.txt`
    );

    // Ensure the output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(
      `[UroWorker] [${requestId}] Output file will be: ${outputFile}`
    );

    // Prepare the uro command arguments
    const uroArgs = ['-i', tempInputFile, '-o', outputFile];

    console.log(
      `[UroWorker] [${requestId}] Executing uro command with args: ${uroArgs.join(
        ' '
      )}`
    );
    const startTime = Date.now();

    // Execute the uro command
    const result = spawnSync('uro', uroArgs, { encoding: 'utf8' });

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(
      `[UroWorker] [${requestId}] Command execution completed in ${executionTime.toFixed(
        2
      )}s`
    );

    // Check for errors
    if (result.error) {
      console.error(
        `[UroWorker] [${requestId}] Error executing uro: ${result.error.message}`
      );
      throw new Error(`Error executing uro: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(
        `[UroWorker] [${requestId}] uro exited with status ${result.status}`
      );
      console.error(`[UroWorker] [${requestId}] stderr: ${result.stderr}`);
      throw new Error(
        `uro exited with status ${result.status}: ${result.stderr}`
      );
    }

    console.log(
      `[UroWorker] [${requestId}] uro command completed successfully`
    );

    // Send the result back to the parent process
    process.send({
      status: 'success',
      metadata: {
        executionTime,
        requestId,
        outputFile,
      },
    });

    console.log(`[UroWorker] [${requestId}] Request processing complete`);
  } catch (error) {
    const requestId = message?.requestId || 'unknown';

    console.error(`[UroWorker] [${requestId}] Error in worker:`, error);
    console.error(`[UroWorker] [${requestId}] Stack trace:`, error.stack);

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

    console.log(`[UroWorker] [${requestId}] Error notification sent to parent`);
  } finally {
    // Clean up temporary input file
    if (tempInputFile && fs.existsSync(tempInputFile)) {
      fs.unlinkSync(tempInputFile);
      console.log(
        `[UroWorker] [${requestId}] Removed temporary input file: ${tempInputFile}`
      );
    }
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('[UroWorker] Received SIGTERM signal. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[UroWorker] Received SIGINT signal. Shutting down gracefully.');
  process.exit(0);
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[UroWorker] Disconnected from parent process. Exiting.');
  process.exit(1);
});

// Notify parent that worker is ready
console.log('[UroWorker] Worker initialized and ready to process requests');
process.send({ status: 'ready' });
