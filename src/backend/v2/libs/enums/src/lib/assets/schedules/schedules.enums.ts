export enum ScheduleType {
  VULNERABILITY_SCAN = 'VULNERABILITY_SCAN',
  ASSET_SCAN = 'ASSET_SCAN',
  WEBAPP_ASSET_SCAN = 'WEBAPP_ASSET_SCAN',
}

export enum ScheduleRunStatus {
  PENDING = 'pending',
  SENT_TO_QUEUE = 'sent-to-queue',
  FAILED = 'failed',
}

/**
 * Different ways a scan might be triggered:
 *  - assetAdded: automatically triggered when a new asset is added
 *  - assetUpdated: triggered when an asset is updated
 *  - scheduledScan: triggered by a scheduler/cron
 *  - manualScan: triggered manually by a user
 *  - liveScanNucleiTemplateChange: triggered when new Nuclei templates are fetched
 *  - etc...
 */
export enum ScanTriggerType {
  SCHEDULED_SCAN = 'scheduled_scan',
  MANUAL_SCAN = 'manual_scan',
  ASSET_ADDED = 'asset_added',
  ASSET_UPDATED = 'asset_updated',
  LIVE_SCAN_NUCLEI_TEMPLATE_CHANGE = 'live_scan_nuclei_template_change',
  SOURCE_ADDED = 'source_added',
  SOURCE_UPDATED = 'source_updated',
}

export enum ScanStatus {
  PENDING = 'pending',
  SENT = 'sent',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
