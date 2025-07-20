const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Unified worker process that executes steampipe queries for various AWS resource types
 */

console.log('[SteampipeWorker] Worker started');

// Get a readable name for the resource type for logging
function getResourceDisplayName(resourceType) {
  return resourceType
    .replace(/^aws_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Listen for messages from the parent process
process.on('message', async (message) => {
  console.log('[SteampipeWorker] Received message from parent process');
  let tempConfigFile = null;

  try {
    if (!message || !message.credentials) {
      console.error('[SteampipeWorker] No AWS credentials received');
      throw new Error('No AWS credentials received');
    }

    const {
      credentials: { accessKey, secretKey },
      resourceType = 'aws_ec2_instance', // Default resource type
      requestId = crypto.randomUUID().substring(0, 8),
    } = message;

    const resourceDisplayName = getResourceDisplayName(resourceType);

    console.log(
      `[SteampipeWorker] [${requestId}] Processing ${resourceDisplayName} request with provided credentials`
    );

    // Create a temporary HCL config file (not JSON)
    tempConfigFile = path.join(
      os.tmpdir(),
      `steampipe-config-${requestId}.hcl`
    );
    const configContent = `access_key = "${accessKey}"\nsecret_key = "${secretKey}"`;
    fs.writeFileSync(tempConfigFile, configContent, 'utf8');

    console.log(
      `[SteampipeWorker] [${requestId}] Created temporary config file at ${tempConfigFile}`
    );
    console.log(
      `[SteampipeWorker] [${requestId}] Preparing to execute steampipe command for ${resourceType}`
    );

    // Run steampipe command using spawnSync with cat for the config file
    console.log(
      `[SteampipeWorker] [${requestId}] Executing steampipe_export_aws command for ${resourceType}...`
    );
    const startTime = Date.now();

    // Use cat to read the config file and pass it to steampipe
    const result = spawnSync(
      'sh',
      [
        '-c',
        `steampipe_export_aws --config "$(cat ${tempConfigFile})" ${resourceType} --output json`,
      ],
      {
        encoding: 'utf8',
      }
    );

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(
      `[SteampipeWorker] [${requestId}] Command execution completed in ${executionTime.toFixed(
        2
      )}s`
    );

    // Clean up the temporary config file
    if (fs.existsSync(tempConfigFile)) {
      fs.unlinkSync(tempConfigFile);
      console.log(
        `[SteampipeWorker] [${requestId}] Removed temporary config file`
      );
    }

    // Check for errors
    if (result.error) {
      console.error(
        `[SteampipeWorker] [${requestId}] Error executing steampipe: ${result.error.message}`
      );
      throw new Error(`Error executing steampipe: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(
        `[SteampipeWorker] [${requestId}] steampipe exited with status ${result.status}`
      );
      console.error(
        `[SteampipeWorker] [${requestId}] stderr: ${result.stderr}`
      );
      throw new Error(
        `steampipe exited with status ${result.status}: ${result.stderr}`
      );
    }

    let resources = null;
    if (result.stdout) {
      // Parse the JSON output
      console.log(`[SteampipeWorker] [${requestId}] Parsing JSON output`);
      resources = JSON.parse(result.stdout);
      console.log(
        `[SteampipeWorker] [${requestId}] Successfully parsed ${resources.length} ${resourceDisplayName}s`
      );
    } else {
      console.log(
        `[SteampipeWorker] [${requestId}] No resources found for ${resourceDisplayName}`
      );
      resources = [];
    }

    // Send the result back to the parent process
    console.log(
      `[SteampipeWorker] [${requestId}] Sending results back to parent process`
    );
    process.send({
      status: 'success',
      data: resources,
      metadata: {
        count: resources.length,
        executionTime,
        requestId,
        resourceType,
      },
    });

    console.log(`[SteampipeWorker] [${requestId}] Request processing complete`);
  } catch (error) {
    const requestId = message?.requestId || 'unknown';
    const resourceType = message?.resourceType || 'unknown';

    console.error(
      `[SteampipeWorker] [${requestId}] Error in worker for ${resourceType}:`,
      error
    );
    console.error(`[SteampipeWorker] [${requestId}] Stack trace:`, error.stack);

    // Clean up the temporary config file if it exists
    if (tempConfigFile && fs.existsSync(tempConfigFile)) {
      fs.unlinkSync(tempConfigFile);
      console.log(
        `[SteampipeWorker] [${requestId}] Removed temporary config file after error`
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
      resourceType,
    });

    console.log(
      `[SteampipeWorker] [${requestId}] Error notification sent to parent`
    );
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log(
    '[SteampipeWorker] Received SIGTERM signal. Shutting down gracefully.'
  );
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(
    '[SteampipeWorker] Received SIGINT signal. Shutting down gracefully.'
  );
  process.exit(0);
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[SteampipeWorker] Disconnected from parent process. Exiting.');
  process.exit(1);
});

// Notify parent that worker is ready
console.log(
  '[SteampipeWorker] Worker initialized and ready to process requests'
);
process.send({ status: 'ready' });
