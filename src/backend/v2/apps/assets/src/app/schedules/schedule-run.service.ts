import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import {
  AssetEventData,
  SourceEventData,
  WebappAssetEventData,
} from '@firewall-backend/dto';
import {
  CloudEvent,
  MessagePubSubService,
} from '@firewall-backend/message-pub-sub';
import {
  ScanTriggerType,
  ScheduleRunStatus,
  ScheduleType,
  VulnerabilityProfiles,
} from '@firewall-backend/enums';
import * as UUID from 'uuid';
import { Asset, ScheduleRun, Source } from '@firewall-backend/entities';
import { CreateScheduleRunDto } from './dto/schedules.dto';

@Injectable()
export class ScheduleRunService {
  constructor(
    private readonly pubSubService: MessagePubSubService,
    @InjectRepository(ScheduleRun)
    private readonly scheduleRunRepository: Repository<ScheduleRun>,
    @InjectPinoLogger(ScheduleRunService.name)
    private readonly logger: PinoLogger
  ) {}

  private async pushToVulnerabilityQueue(body: AssetEventData) {
    try {
      this.logger.info({ body }, 'Pushing message to vulnerability queue');

      const { assetName, assetType } = body;

      const message: CloudEvent<AssetEventData> = {
        data: body,
        id: UUID.v4(),
        source: 'api',
        specversion: '1.0',
        time: new Date(),
        type: `asset.${assetType}.${
          body.scanType === ScanTriggerType.ASSET_UPDATED ? 'updated' : 'added'
        }`,
      };

      this.logger.info({ message }, 'Cloud event message');

      await this.pubSubService.sendMessage<AssetEventData>(
        message.type,
        message,
        'vulnerability-exchange',
        'vulnerability-queue'
      );
      this.logger.info(
        { assetName, assetType, messageId: message.id },
        'Message pushed to vulnerability queue'
      );

      return message.id;
    } catch (err) {
      this.logger.error(
        { err, body },
        'Error pushing message to vulnerability queue'
      );
      throw new Error('Failed to push message to vulnerability queue');
    }
  }

  private async pushToAssetQueue(body: SourceEventData) {
    try {
      this.logger.info({ body }, 'Pushing message to asset queue');

      const { sourceType, sourceName } = body;

      const message: CloudEvent<SourceEventData> = {
        data: body,
        id: UUID.v4(),
        source: 'api',
        specversion: '1.0',
        time: new Date(),
        type: `source.${sourceType}.${
          body.scanType === ScanTriggerType.SOURCE_UPDATED ? 'updated' : 'added'
        }`,
      };

      this.logger.info({ message }, 'Cloud event message');

      await this.pubSubService.sendMessage<SourceEventData>(
        message.type,
        message,
        'asset-exchange',
        'asset-queue'
      );
      this.logger.info(
        { sourceName, messageId: message.id },
        'Message pushed to asset queue'
      );

      return message.id;
    } catch (err) {
      this.logger.error({ err, body }, 'Error pushing message to asset queue');
      throw new Error('Failed to push message to asset queue');
    }
  }

  private async pushToWebappAssetQueue(body: WebappAssetEventData) {
    try {
      this.logger.info({ body }, 'Pushing message to webapp asset queue');

      const message: CloudEvent<WebappAssetEventData> = {
        data: body,
        id: UUID.v4(),
        source: 'api',
        specversion: '1.0',
        time: new Date(),
        type: `webapp.${
          body.scanType === ScanTriggerType.ASSET_UPDATED ? 'updated' : 'added'
        }`,
      };

      this.logger.info({ message }, 'Cloud event message');

      await this.pubSubService.sendMessage<WebappAssetEventData>(
        message.type,
        message,
        'asset-exchange',
        'webapp-asset-queue'
      );
      this.logger.info(
        { messageId: message.id },
        'Message pushed to webapp asset queue'
      );

      return message.id;
    } catch (err) {
      this.logger.error(
        { err, body },
        'Error pushing message to webapp asset queue'
      );
      throw new Error('Failed to push message webapp to asset queue');
    }
  }

  private async batchProcess<T>(promises: Promise<T>[], batchSize = 10) {
    try {
      this.logger.info(
        { promiseCount: promises.length, batchSize },
        'Batch processing'
      );

      return await Promise.allSettled(promises);
    } catch (err) {
      this.logger.error({ err }, 'Error batch processing');
      throw new Error('Error batch processing');
    }
  }

  private async runVulnerabilityScanSchedule(
    vulnerabilityProfiles: VulnerabilityProfiles[] = null,
    assets: Asset[] = [],
    scheduleId?: number,
    triggerType: ScanTriggerType = ScanTriggerType.SCHEDULED_SCAN,
    currentUserId?: number
  ): Promise<ScheduleRun> {
    const scheduleRun = await this.scheduleRunRepository.save({
      status: ScheduleRunStatus.PENDING,
      triggerType,
      scheduleId,
    });

    try {
      this.logger.info(
        {
          scheduleId,
          assetCount: assets.length,
          vulnerabilityProfiles,
          currentUserId,
        },
        'Running vulnerability scan schedule'
      );

      if (!vulnerabilityProfiles) {
        vulnerabilityProfiles = Object.values(VulnerabilityProfiles);
      }

      const assetEventDatas: AssetEventData[] = assets.map((asset) => {
        return {
          assetId: asset.id,
          assetName: asset.name,
          assetType: asset.type,
          profiles: vulnerabilityProfiles,
          scanType: triggerType,
          scanCreatedBy: currentUserId,
          scheduleRunId: scheduleRun.id,
        };
      });

      const results = await this.batchProcess<string>(
        assetEventDatas.map((assetEventData) =>
          this.pushToVulnerabilityQueue(assetEventData)
        )
      );

      const succeeded = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const failed = results.filter((result) => result.status === 'rejected');

      this.logger.info(
        { successCount: succeeded.length, failedCount: failed.length, results },
        'Batch process results'
      );

      const updatedScheduleRun = await this.updateScheduleRun(
        scheduleRun.id,
        {
          successCount: succeeded.length,
          failedCount: failed.length,
          status: ScheduleRunStatus.SENT_TO_QUEUE,
          details: JSON.stringify({
            assets,
            succeeded,
            failed,
          }),
        },
        currentUserId
      );

      this.logger.info(
        { scheduleRunId: updatedScheduleRun.id },
        'Ran vulnerability scan schedule'
      );

      return updatedScheduleRun;
    } catch (err) {
      const updatedScheduleRun = await this.updateScheduleRun(scheduleRun.id, {
        successCount: 0,
        failedCount: assets.length,
        status: ScheduleRunStatus.FAILED,
        details: JSON.stringify({
          assets,
          error: err.message,
        }),
      });

      this.logger.error(
        { err, updatedScheduleRun },
        'Error running vulnerability scan schedule'
      );

      throw new Error('Error running vulnerability scan schedule');
    }
  }

  private async runAssetScanSchedule(
    sources: Source[] = [],
    scheduleId: number = null,
    triggerType: ScanTriggerType = ScanTriggerType.SCHEDULED_SCAN,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<ScheduleRun> {
    const scheduleRun = await this.scheduleRunRepository.save({
      status: ScheduleRunStatus.PENDING,
      triggerType,
      scheduleId,
    });

    try {
      this.logger.info(
        {
          scheduleId,
          sourceCount: sources.length,
          currentUserId,
        },
        'Running asset scan schedule'
      );

      const sourceEventDatas: SourceEventData[] = sources.map((source) => {
        return {
          scanType: triggerType,
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          scanCreatedBy: currentUserId,
          scheduleRunId: scheduleRun.id,
          assetScanId,
        };
      });

      const results = await this.batchProcess<string>(
        sourceEventDatas.map((sourceEventData) =>
          this.pushToAssetQueue(sourceEventData)
        )
      );

      const succeeded = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const failed = results.filter((result) => result.status === 'rejected');

      this.logger.info(
        { successCount: succeeded.length, failedCount: failed.length, results },
        'Batch process results'
      );

      const updatedScheduleRun = await this.updateScheduleRun(
        scheduleRun.id,
        {
          successCount: succeeded.length,
          failedCount: failed.length,
          status: ScheduleRunStatus.SENT_TO_QUEUE,
          details: JSON.stringify({
            sources,
            succeeded,
            failed,
          }),
        },
        currentUserId
      );

      this.logger.info({ updatedScheduleRun }, 'Ran asset scan schedule');

      return updatedScheduleRun;
    } catch (err) {
      const updatedScheduleRun = await this.updateScheduleRun(scheduleRun.id, {
        successCount: 0,
        failedCount: sources.length,
        status: ScheduleRunStatus.FAILED,
        details: JSON.stringify({
          sources,
          error: err.message,
        }),
      });

      this.logger.error(
        { err, updatedScheduleRun },
        'Error running asset scan schedule'
      );

      throw new Error('Error running asset scan schedule');
    }
  }

  private async runWebappAssetScanSchedule(
    webapps: Asset[] = [],
    scheduleId: number = null,
    triggerType: ScanTriggerType = ScanTriggerType.SCHEDULED_SCAN,
    currentUserId: number = null,
    assetScanId: number = null,
    sourceId: number = null
  ): Promise<ScheduleRun> {
    const scheduleRun = await this.scheduleRunRepository.save({
      status: ScheduleRunStatus.PENDING,
      triggerType,
      scheduleId,
    });

    try {
      this.logger.info(
        {
          scheduleId,
          webappCount: webapps.length,
          currentUserId,
        },
        'Running asset scan schedule'
      );

      const webappAssetEventDatas: WebappAssetEventData[] = webapps.map(
        (webapp) => {
          return {
            scanType: triggerType,
            webappId: webapp.id,
            scanCreatedBy: currentUserId,
            scheduleRunId: scheduleRun.id,
            assetScanId,
            sourceId,
          };
        }
      );

      const results = await this.batchProcess<string>(
        webappAssetEventDatas.map((webappAssetEventData) =>
          this.pushToWebappAssetQueue(webappAssetEventData)
        )
      );

      const succeeded = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const failed = results.filter((result) => result.status === 'rejected');

      this.logger.info(
        { successCount: succeeded.length, failedCount: failed.length, results },
        'Batch process results'
      );

      const updatedScheduleRun = await this.updateScheduleRun(
        scheduleRun.id,
        {
          successCount: succeeded.length,
          failedCount: failed.length,
          status: ScheduleRunStatus.SENT_TO_QUEUE,
          details: JSON.stringify({
            webapps,
            succeeded,
            failed,
          }),
        },
        currentUserId
      );

      this.logger.info({ updatedScheduleRun }, 'Ran asset scan schedule');

      return updatedScheduleRun;
    } catch (err) {
      const updatedScheduleRun = await this.updateScheduleRun(scheduleRun.id, {
        successCount: 0,
        failedCount: webapps.length,
        status: ScheduleRunStatus.FAILED,
        details: JSON.stringify({
          webapps,
          error: err.message,
        }),
      });

      this.logger.error(
        { err, updatedScheduleRun },
        'Error running asset scan schedule'
      );

      throw new Error('Error running asset scan schedule');
    }
  }

  async createScheduleRun({
    type = ScheduleType.VULNERABILITY_SCAN,
    vulnerabilityProfiles = null,
    assets = [],
    sources = [],
    scheduleId = null,
    triggerType = ScanTriggerType.SCHEDULED_SCAN,
    currentUserId = null,
    assetScanId = null,
    sourceId = null,
  }: CreateScheduleRunDto): Promise<ScheduleRun> {
    try {
      this.logger.info(
        {
          type,
          vulnerabilityProfiles,
          assetCount: assets.length,
          sourceCount: sources.length,
        },
        'Creating schedule run'
      );

      switch (type) {
        case ScheduleType.VULNERABILITY_SCAN:
          return await this.runVulnerabilityScanSchedule(
            vulnerabilityProfiles,
            assets,
            scheduleId,
            triggerType,
            currentUserId
          );
        case ScheduleType.ASSET_SCAN:
          return await this.runAssetScanSchedule(
            sources,
            scheduleId,
            triggerType,
            currentUserId,
            assetScanId
          );
        case ScheduleType.WEBAPP_ASSET_SCAN:
          return await this.runWebappAssetScanSchedule(
            assets,
            scheduleId,
            triggerType,
            currentUserId,
            assetScanId,
            sourceId
          );
        default:
          this.logger.error({ type }, 'Invalid schedule type');
          throw new BadRequestException('Invalid schedule type');
      }
    } catch (err) {
      this.logger.error({ err }, 'Error creating schedule run');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error creating schedule run');
    }
  }

  async updateScheduleRun(
    scheduleRunId: number,
    updates: Partial<ScheduleRun>,
    currentUserId: number = null
  ): Promise<ScheduleRun> {
    try {
      this.logger.info({ scheduleRunId }, 'Updating schedule run');

      const scheduleRun = await this.scheduleRunRepository.findOne({
        where: {
          id: scheduleRunId,
        },
      });
      if (!scheduleRun) {
        throw new NotFoundException('Schedule run not found');
      }

      return await this.scheduleRunRepository.save({
        ...scheduleRun,
        details: updates.details,
        failedCount: updates.failedCount,
        successCount: updates.successCount,
        status: updates.status,
        updatedByUid: currentUserId,
      });
    } catch (err) {
      this.logger.error({ err }, 'Error updating schedule run');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error updating schedule run');
    }
  }
}
