const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

console.log('[GowitnessWorker] Worker started');

// Listen for messages from the parent process
process.on('message', async (message) => {
  console.log('[GowitnessWorker] Received message from parent process');
  let tempFile = null;

  try {
    if (!message || !message.assetUrls) {
      console.error('[GowitnessWorker] No asset URLs received');
      throw new Error('No asset URLs received');
    }

    const { assetUrls, requestId = crypto.randomUUID().substring(0, 8) } =
      message;

    console.log(
      `[GowitnessWorker] [${requestId}] Processing gowitness scan request`
    );

    // Create a temporary file to store asset URLs
    tempFile = path.join(os.tmpdir(), `gowitness-assets-${requestId}.txt`);
    fs.writeFileSync(tempFile, assetUrls.join('\n'), 'utf8');

    console.log(
      `[GowitnessWorker] [${requestId}] Created temporary file at ${tempFile}`
    );

    // Execute the gowitness command
    console.log(
      `[GowitnessWorker] [${requestId}] Executing gowitness scan command`
    );
    const startTime = Date.now();

    const result = spawnSync(
      'gowitness',
      [
        'scan',
        'file',
        '-f',
        tempFile,
        '--threads',
        '50',
        'delay',
        '5',
        '--no-http',
        '--no-https',
        '--write-jsonl',
        '-T',
        '15',
        '--skip-html',
      ],
      {
        encoding: 'utf8',
      }
    );

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(
      `[GowitnessWorker] [${requestId}] Command execution completed in ${executionTime.toFixed(
        2
      )}s`
    );

    // Clean up the temporary file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`[GowitnessWorker] [${requestId}] Removed temporary file`);
    }

    // Check for errors
    if (result.error) {
      console.error(
        `[GowitnessWorker] [${requestId}] Error executing gowitness: ${result.error.message}`
      );
      throw new Error(`Error executing gowitness: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(
        `[GowitnessWorker] [${requestId}] gowitness exited with status ${result.status}`
      );
      console.error(
        `[GowitnessWorker] [${requestId}] stderr: ${result.stderr}`
      );
      throw new Error(
        `gowitness exited with status ${result.status}: ${result.stderr}`
      );
    }

    console.log(
      `[GowitnessWorker] [${requestId}] gowitness scan completed successfully`
    );

    // Parse the JSONL output file to extract screenshot paths
    const outputFilePath = path.join(process.cwd(), 'gowitness.jsonl');
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    const screenshots = [];
    if (fs.existsSync(outputFilePath)) {
      const lines = fs.readFileSync(outputFilePath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const entry = JSON.parse(trimmedLine);
          if (entry.file_name) {
            const imagePath = path.join(screenshotsDir, entry.file_name);
            // const imageBuffer = fs.readFileSync(imagePath);
            screenshots.push({
              path: imagePath,
              metadata: trimmedLine,
            });
          }
        }
      }

      // Clean up the temporary file
      if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
        console.log(
          `[GowitnessWorker] [${requestId}] Removed output json file`
        );
      }
    }

    // Clean up the screenshots directory
    // if (fs.existsSync(screenshotsDir)) {
    //   const files = fs.readdirSync(screenshotsDir);
    //   for (const file of files) {
    //     const filePath = path.join(screenshotsDir, file);
    //     fs.unlinkSync(filePath);
    //   }
    //   fs.rmdirSync(screenshotsDir);
    //   console.log(
    //     `[GowitnessWorker] [${requestId}] Removed screenshots directory`
    //   );
    // }

    // Send the result back to the parent process
    process.send({
      status: 'success',
      metadata: {
        executionTime,
        requestId,
        screenshots,
      },
    });

    console.log(`[GowitnessWorker] [${requestId}] Request processing complete`);
  } catch (error) {
    const requestId = message?.requestId || 'unknown';

    console.error(`[GowitnessWorker] [${requestId}] Error in worker:`, error);
    console.error(`[GowitnessWorker] [${requestId}] Stack trace:`, error.stack);

    // Clean up the temporary file if it exists
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(
        `[GowitnessWorker] [${requestId}] Removed temporary file after error`
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
      `[GowitnessWorker] [${requestId}] Error notification sent to parent`
    );
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log(
    '[GowitnessWorker] Received SIGTERM signal. Shutting down gracefully.'
  );
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(
    '[GowitnessWorker] Received SIGINT signal. Shutting down gracefully.'
  );
  process.exit(0);
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[GowitnessWorker] Disconnected from parent process. Exiting.');
  process.exit(1);
});

// Notify parent that worker is ready
console.log(
  '[GowitnessWorker] Worker initialized and ready to process requests'
);
process.send({ status: 'ready' });
