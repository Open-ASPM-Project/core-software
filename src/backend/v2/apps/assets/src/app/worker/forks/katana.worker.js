const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

console.log('[KatanaWorker] Worker started');

// Listen for messages from the parent process
process.on('message', async (message) => {
  console.log('[KatanaWorker] Received message from parent process');
  let tempUrlFile = null;
  let tempCrawlerConfigFile = null;
  let tempFormConfigFile = null;
  let tempFieldConfigFile = null;

  const { requestId = crypto.randomUUID().substring(0, 8) } = message;

  try {
    if (!message || !message.webappUrls) {
      console.error('[KatanaWorker] Invalid message received');
      throw new Error('Invalid message received');
    }

    const {
      webappUrls,
      crawlerConfig,
      formConfig,
      fieldConfig,
      headers = {},
    } = message;

    console.log(`[KatanaWorker] [${requestId}] Processing katana scan request`);

    // Create a temporary file to store the list of URLs
    tempUrlFile = path.join(os.tmpdir(), `katana-urls-${requestId}.txt`);
    fs.writeFileSync(tempUrlFile, webappUrls.join('\n'), 'utf8');
    console.log(
      `[KatanaWorker] [${requestId}] Created temporary URL file: ${tempUrlFile}`
    );

    // Create temporary YAML config files
    if (crawlerConfig) {
      tempCrawlerConfigFile = path.join(
        os.tmpdir(),
        `katana-crawler-config-${requestId}.yaml`
      );
      fs.writeFileSync(
        tempCrawlerConfigFile,
        yaml.dump(crawlerConfig),
        'utf-8'
      );
    }

    if (fieldConfig) {
      tempFieldConfigFile = path.join(
        os.tmpdir(),
        `katana-field-config-${requestId}.yaml`
      );
      fs.writeFileSync(tempFieldConfigFile, yaml.dump(fieldConfig), 'utf-8');
    }

    if (formConfig) {
      tempFormConfigFile = path.join(
        os.tmpdir(),
        `katana-form-config-${requestId}.yaml`
      );
      fs.writeFileSync(tempFormConfigFile, yaml.dump(formConfig), 'utf-8');
    }

    console.log(
      `[KatanaWorker] [${requestId}] Created temporary config files: ${tempCrawlerConfigFile}, ${tempFieldConfigFile}, ${tempFormConfigFile}`
    );

    // Prepare the katana command arguments
    const responseDir = path.join(
      process.cwd(),
      'crawled_data',
      `crawled_${requestId}`
    );

    const katanaArgs = [
      '-list',
      tempUrlFile,
      '-store-response-dir',
      responseDir,
    ];

    // Add config files if provided
    if (crawlerConfig) {
      katanaArgs.push('-config', tempCrawlerConfigFile);
    }
    if (formConfig) {
      katanaArgs.push('-fc', tempFormConfigFile);
    }
    if (fieldConfig) {
      katanaArgs.push('-flc', tempFieldConfigFile);
    }

    // Add headers if available
    if (headers.Authorization) {
      katanaArgs.push('-H', `Authorization: ${headers.Authorization}`);
    }
    if (headers.Cookie) {
      katanaArgs.push('-H', `Cookie: ${headers.Cookie}`);
    }

    console.log(
      `[KatanaWorker] [${requestId}] Executing katana command with args: ${katanaArgs.join(
        ' '
      )}`
    );
    const startTime = Date.now();

    // Execute the katana command
    const result = spawnSync('katana', katanaArgs, { encoding: 'utf8' });

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(
      `[KatanaWorker] [${requestId}] Command execution completed in ${executionTime.toFixed(
        2
      )}s`
    );

    // Check for errors
    if (result.error) {
      console.error(
        `[KatanaWorker] [${requestId}] Error executing katana: ${result.error.message}`
      );
      throw new Error(`Error executing katana: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(
        `[KatanaWorker] [${requestId}] katana exited with status ${result.status}`
      );
      console.error(`[KatanaWorker] [${requestId}] stderr: ${result.stderr}`);
      throw new Error(
        `katana exited with status ${result.status}: ${result.stderr}`
      );
    }

    console.log(
      `[KatanaWorker] [${requestId}] katana scan completed successfully`
    );

    // Send the result back to the parent process
    process.send({
      status: 'success',
      metadata: {
        executionTime,
        requestId,
        responseDir,
      },
    });

    console.log(`[KatanaWorker] [${requestId}] Request processing complete`);
  } catch (error) {
    const requestId = message?.requestId || 'unknown';

    console.error(`[KatanaWorker] [${requestId}] Error in worker:`, error);
    console.error(`[KatanaWorker] [${requestId}] Stack trace:`, error.stack);

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
      `[KatanaWorker] [${requestId}] Error notification sent to parent`
    );
  } finally {
    // Clean up temporary config files
    // if (fs.existsSync(tempCrawlerConfigFile)) {
    //   fs.unlinkSync(tempCrawlerConfigFile);
    // }
    // if (fs.existsSync(tempFieldConfigFile)) {
    //   fs.unlinkSync(tempFieldConfigFile);
    // }
    // if (fs.existsSync(tempFormConfigFile)) {
    //   fs.unlinkSync(tempFormConfigFile);
    // }
    console.log(
      `[KatanaWorker] [${requestId}] Removed temporary config files: ${tempCrawlerConfigFile}, ${tempFieldConfigFile}, ${tempFormConfigFile}`
    );

    // Clean up temporary URL file
    if (tempUrlFile && fs.existsSync(tempUrlFile)) {
      fs.unlinkSync(tempUrlFile);
      console.log(
        `[KatanaWorker] [${requestId}] Removed temporary URL file: ${tempUrlFile}`
      );
    }
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log(
    '[KatanaWorker] Received SIGTERM signal. Shutting down gracefully.'
  );
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(
    '[KatanaWorker] Received SIGINT signal. Shutting down gracefully.'
  );
  process.exit(0);
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[KatanaWorker] Disconnected from parent process. Exiting.');
  process.exit(1);
});

// Notify parent that worker is ready
console.log('[KatanaWorker] Worker initialized and ready to process requests');
process.send({ status: 'ready' });
