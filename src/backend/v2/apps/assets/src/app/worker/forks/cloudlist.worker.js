const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

// Enums are typically compiled to objects in JavaScript
const CloudType = {
  AWS: 'aws',
  GCP: 'gcp',
  AZURE: 'azure',
  DIGITAL_OCEAN: 'digitalocean',
  SCALEWAY: 'scaleway',
  ARVANCLOUD: 'arvancloud',
  CLOUDFLARE: 'cloudflare',
  HEROKU: 'heroku',
  FASTLY: 'fastly',
  LINODE: 'linode',
  NAMECHEAP: 'namecheap',
  ALIBABA: 'alibaba',
  TERRAFORM: 'terraform',
  HASHICORP_CONSUL: 'consul',
  HASHICORP_NOMAD: 'nomad',
  HETZNER: 'hetzner',
  KUBERNETES: 'kubernetes',
  DNSSIMPLE: 'dnssimple',
};

/**
 * Converts a string from camelCase to snake_case.
 * Handles basic cases like myKeyName -> my_key_name.
 * Does not specifically handle acronyms (e.g., URLKey -> u_r_l_key).
 * @param {string} str The input camelCase string.
 * @returns {string} The converted snake_case string.
 */
function toSnakeCase(str) {
  if (typeof str !== 'string' || !str) {
    return str;
  }
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

/**
 * Recursively converts the keys of an object (and its nested objects/arrays)
 * from camelCase to snake_case.
 * @param {*} obj The object or value to process.
 * @returns {*} A new object/array with snake_case keys, or the original value if not an object/array.
 */
function keysToSnakeCase(obj) {
  // Handle non-objects/arrays and null
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Handle arrays: recursively process each item
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnakeCase(item));
  }

  // Handle objects
  const newObj = {};
  for (const key in obj) {
    // Check for own properties to avoid iterating prototype chain
    if (Object.hasOwn(obj, key)) {
      const snakeKey = toSnakeCase(key);
      const value = obj[key];
      // Recursively process the value
      newObj[snakeKey] = keysToSnakeCase(value);
    }
  }
  return newObj;
}

/**
 * Create temporary credential file for cloudlist (adapted for worker)
 */
function createProviderConfigFileInternal(source) {
  const tempDir = os.tmpdir();
  const filename = path.join(
    tempDir,
    `cloudlist-worker-config-${process.pid}-${Date.now()}.yaml`
  );

  const credentials = {};
  let missingCredentials = false;

  // Simplified credential extraction based on type
  switch (source.cloudType) {
    case CloudType.AWS:
      credentials.awsAccessKey = source.awsAccessKey;
      credentials.awsSecretKey = source.awsSecretKey;
      if (!credentials.awsAccessKey || !credentials.awsSecretKey)
        missingCredentials = true;
      break;
    case CloudType.GCP:
      credentials.gcpServiceAccountKey = source.gcpServiceAccountKey;
      if (!credentials.gcpServiceAccountKey) missingCredentials = true;
      break;
    case CloudType.AZURE:
      credentials.clientId = source.clientId;
      credentials.clientSecret = source.clientSecret;
      credentials.tenantId = source.tenantId;
      credentials.subscriptionId = source.subscriptionId;
      if (
        !credentials.clientId ||
        !credentials.clientSecret ||
        !credentials.tenantId ||
        !credentials.subscriptionId
      )
        missingCredentials = true;
      break;
    case CloudType.DIGITAL_OCEAN:
      credentials.digitaloceanToken = source.digitaloceanToken;
      if (!credentials.digitaloceanToken) missingCredentials = true;
      break;
    case CloudType.SCALEWAY:
      credentials.scalewayAccessKey = source.scalewayAccessKey;
      credentials.scalewayAccessToken = source.scalewayAccessToken;
      if (!credentials.scalewayAccessKey || !credentials.scalewayAccessToken)
        missingCredentials = true;
      break;
    case CloudType.ARVANCLOUD:
      credentials.apiKey = source.apiKey;
      if (!credentials.apiKey) missingCredentials = true;
      break;
    case CloudType.CLOUDFLARE:
      credentials.email = source.email;
      credentials.apiKey = source.apiKey;
      if (!credentials.email || !credentials.apiKey) missingCredentials = true;
      break;
    case CloudType.HEROKU:
      credentials.herokuApiToken = source.herokuApiToken;
      if (!credentials.herokuApiToken) missingCredentials = true;
      break;
    case CloudType.FASTLY:
      credentials.fastlyApiKey = source.fastlyApiKey;
      if (!credentials.fastlyApiKey) missingCredentials = true;
      break;
    case CloudType.LINODE:
      credentials.linodePersonalAccessToken = source.linodePersonalAccessToken;
      if (!credentials.linodePersonalAccessToken) missingCredentials = true;
      break;
    case CloudType.NAMECHEAP:
      credentials.namecheapApiKey = source.namecheapApiKey;
      credentials.namecheapUserName = source.namecheapUserName;
      if (!credentials.namecheapApiKey || !credentials.namecheapUserName)
        missingCredentials = true;
      break;
    case CloudType.ALIBABA:
      credentials.alibabaAccessKey = source.alibabaAccessKey;
      credentials.alibabaAccessKeySecret = source.alibabaAccessKeySecret;
      credentials.alibabaRegionId = source.alibabaRegionId;
      if (
        !credentials.alibabaAccessKey ||
        !credentials.alibabaAccessKeySecret ||
        !credentials.alibabaRegionId
      )
        missingCredentials = true;
      break;
    case CloudType.TERRAFORM:
      credentials.tfStateFile = source.tfStateFile;
      if (!credentials.tfStateFile) missingCredentials = true;
      break;
    case CloudType.HASHICORP_CONSUL:
      credentials.consulUrl = source.consulUrl;
      if (!credentials.consulUrl) missingCredentials = true;
      break;
    case CloudType.HASHICORP_NOMAD:
      credentials.nomadUrl = source.nomadUrl;
      if (!credentials.nomadUrl) missingCredentials = true;
      break;
    case CloudType.HETZNER:
      credentials.authToken = source.authToken;
      if (!credentials.authToken) missingCredentials = true;
      break;
    case CloudType.KUBERNETES:
      credentials.kubeconfigFile = source.kubeconfigFile;
      credentials.kubeconfigEncoded = source.kubeconfigEncoded;
      if (!credentials.kubeconfigFile && !credentials.kubeconfigEncoded)
        missingCredentials = true; // Allow one or the other
      break;
    case CloudType.DNSSIMPLE:
      credentials.dnssimpleApiToken = source.dnssimpleApiToken;
      if (!credentials.dnssimpleApiToken) missingCredentials = true;
      break;
    default:
      // Should not happen if validation is done in parent
      throw new Error(`[Worker] Unsupported cloud type: ${source.cloudType}`);
  }

  if (missingCredentials) {
    console.error(`[Worker] Missing credentials for ${source.cloudType}`);
    // Throw error to be caught and sent back via IPC
    throw new Error(`Missing credentials for ${source.cloudType}`);
  }

  const providerConfigContent = yaml.dump([
    {
      provider: source.cloudType,
      id: source.uuid, // Include id if needed by cloudlist or for logging
      ...keysToSnakeCase(credentials),
    },
  ]);

  console.log(`[CloudlistWorker] Writing config to ${filename}`);
  fs.writeFileSync(filename, providerConfigContent, { mode: 0o600 });
  return filename;
}

function runCloudListSyncInternal(source) {
  console.log(
    `[CloudlistWorker] Received source: ${source.uuid} (${source.cloudType}). Preparing spawnSync.`
  );
  let providerConfigFile = null;

  try {
    providerConfigFile = createProviderConfigFileInternal(source);
    console.log(
      `[CloudlistWorker] Created provider config: ${providerConfigFile}`
    );

    const command = 'cloudlist';
    const args = [
      '-pc',
      providerConfigFile,
      '-silent', // Keep silent to avoid excessive console noise
    ];
    console.log(`[CloudlistWorker] Executing cloudlist with spawnSync...`);

    const cloudlistResult = spawnSync(command, args, {
      encoding: 'utf8',
      timeout: 600000, // 10 minute timeout (adjust as needed)
      maxBuffer: 100 * 1024 * 1024, // 100 MB buffer (adjust if needed)
    });

    console.log(
      `[CloudlistWorker] spawnSync finished for ${source.uuid}. Status: ${cloudlistResult.status}`
    );

    if (cloudlistResult.error) {
      console.error(
        '[CloudlistWorker] Error spawning sync process:',
        cloudlistResult.error
      );
      throw cloudlistResult.error;
    }

    if (cloudlistResult.stderr) {
      console.warn(
        '[CloudlistWorker] cloudlist stderr:',
        cloudlistResult.stderr.slice(0, 1000)
      );
    }

    if (cloudlistResult.status !== 0) {
      const errorMessage = `[CloudlistWorker] cloudlist process for ${
        source.uuid
      } exited with status ${cloudlistResult.status}${
        cloudlistResult.signal ? ` (signal: ${cloudlistResult.signal})` : ''
      }`;
      console.error(errorMessage);
      throw new Error(
        `${errorMessage}${
          cloudlistResult.stderr ? `\nStderr: ${cloudlistResult.stderr}` : ''
        }`
      );
    }

    const assets = (cloudlistResult.stdout || '')
      .split(os.EOL)
      .filter(Boolean)
      .map((asset) => asset.trim());

    console.log(
      `[CloudlistWorker] Processed ${assets.length} assets for ${source.uuid}.`
    );
    return assets;
  } finally {
    // Clean up temp credential file
    if (providerConfigFile) {
      try {
        fs.unlinkSync(providerConfigFile);
        console.log(`[CloudlistWorker] Cleaned up ${providerConfigFile}`);
      } catch (e) {
        console.error(
          `[CloudlistWorker] Error deleting provider config file ${providerConfigFile}:`,
          e.message
        );
      }
    }
  }
}

// Listen for messages from the parent process
process.on('message', (message) => {
  if (message && message.source) {
    try {
      const results = runCloudListSyncInternal(message.source);
      // Send results back to parent
      if (process.send) {
        process.send({ status: 'success', results });
      }
    } catch (error) {
      // Send error back to parent
      if (process.send) {
        process.send({
          status: 'error',
          error: { message: error.message, stack: error.stack },
          sourceUuid: message.source.uuid, // Include identifier in error
        });
      }
    } finally {
      // Ensure the worker exits after processing one message
      process.exit(0);
    }
  } else {
    console.error('[CloudlistWorker] Received invalid message:', message);
    if (process.send) {
      process.send({
        status: 'error',
        error: { message: 'Invalid message received by CloudlistWorker' },
      });
    }
    process.exit(1);
  }
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[CloudlistWorker] Disconnected from parent. Exiting.');
  process.exit(1);
});

console.log('[CloudlistWorker] cloudlist-sync-worker started.');
