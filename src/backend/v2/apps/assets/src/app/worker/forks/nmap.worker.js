const { spawnSync } = require('child_process');
const os = require('os');

// Define the result structure within the worker too
// interface PortScanResult {
//   host: string;
//   ports: number[];
// }

function runNmapSyncInternal(host) {
  console.log(`[NmapWorker] Received host: ${host}. Preparing spawnSync.`);

  const command = 'sudo'; // Requires sudo for -sS
  const args = [
    'nmap',
    '-sS', // TCP SYN scan (requires sudo)
    '-sU', // UDP Scan (requires sudo)
    '-T4', // Timing template (aggressive)
    '-p',
    'T:1-10000,U:1-1000', // Scan top 10k TCP, top 1k UDP
    '--min-parallelism',
    '100',
    '--max-retries',
    '2',
    '-Pn', // Skip host discovery (assume host is up)
    '--open', // Only show open (or possibly open|filtered) ports
    '-oG', // Grepable output
    '-', // Output to stdout
    host,
  ];
  console.log(`[NmapWorker] Executing nmap with spawnSync...`);

  const nmapResult = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 600000, // 10 minute timeout for the sync nmap process (adjust as needed)
    maxBuffer: 50 * 1024 * 1024, // 50 MB buffer (adjust if needed)
  });

  console.log(
    `[NmapWorker] spawnSync finished for ${host}. Status: ${nmapResult.status}`
  );

  if (nmapResult.error) {
    console.error(
      '[NmapWorker] Error spawning sync process:',
      nmapResult.error
    );
    throw nmapResult.error;
  }

  if (nmapResult.stderr) {
    // Log stderr from the worker for debugging if needed
    console.warn('[NmapWorker] nmap stderr:', nmapResult.stderr.slice(0, 1000));
  }

  if (nmapResult.status !== 0) {
    const errorMessage = `[NmapWorker] nmap process for ${host} exited with status ${
      nmapResult.status
    }${nmapResult.signal ? ` (signal: ${nmapResult.signal})` : ''}`;
    console.error(errorMessage);
    throw new Error(
      `${errorMessage}${
        nmapResult.stderr ? `\nStderr: ${nmapResult.stderr}` : ''
      }`
    );
  }

  // Extract port numbers using regex similar to grep -oP '\d+(?=/open)'
  const portNumbers = [];
  const regex = /(\d+)\/open/g;
  let match;
  const stdoutData = nmapResult.stdout || '';

  while ((match = regex.exec(stdoutData)) !== null) {
    portNumbers.push(parseInt(match[1], 10));
  }

  console.log(
    `[NmapWorker] Processed ${portNumbers.length} open ports for ${host}.`
  );
  return { host, ports: portNumbers };
}

// Listen for messages from the parent process
process.on('message', (message) => {
  if (message && message.host) {
    try {
      const result = runNmapSyncInternal(message.host);
      // Send results back to parent
      process.send({ status: 'success', result });
    } catch (error) {
      // Send error back to parent
      process.send({
        status: 'error',
        error: { message: error.message, stack: error.stack },
        host: message.host, // Include host in error message for context
      });
    } finally {
      // Ensure the worker exits after processing one message
      process.exit(0);
    }
  } else {
    console.error('[NmapWorker] Received invalid message:', message);
    process.send({
      status: 'error',
      error: { message: 'Invalid message received by NmapWorker' },
    });
    process.exit(1);
  }
});

// Handle potential disconnects or parent exit
process.on('disconnect', () => {
  console.log('[NmapWorker] Disconnected from parent. Exiting.');
  process.exit(1);
});

console.log('[NmapWorker] nmap-sync-worker started.');
