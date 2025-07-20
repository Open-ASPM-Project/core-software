import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CloudlistUtils } from './fork-utils/cloudlist.utils';
import { NmapUtils, PortScanResult } from './fork-utils/nmap.utils';
import { SourceEventData } from '@firewall-backend/dto';
import {
  CloudEvent,
  MessagePubSubService,
} from '@firewall-backend/message-pub-sub';
import * as UUID from 'uuid';
import { GetWebServersDto } from './dto/asset.worker.dto';
import { SteampipeUtils } from './fork-utils/steampipe.utils';
import { AwsServiceAssetType, AssetSubType } from '@firewall-backend/enums';
import { HttpxUtils } from './fork-utils/httpx.utils';
import { SourcesService } from '../sources/sources.service';
import { GowitnessUtils } from './fork-utils/gowitness.utils';
import { KatanaUtils } from './fork-utils/katana.utils';
import { UroUtils } from './fork-utils/uro.utils';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { ConfigurationService } from '@firewall-backend/configuration';
import {
  DEFAULT_CRAWLER_CONFIG_UUID,
  DEFAULT_FORM_CONFIG_UUID,
} from '@firewall-backend/constants';

@Injectable()
export class AssetWorkerService {
  constructor(
    private readonly pubSubService: MessagePubSubService,
    private readonly sourcesService: SourcesService,
    private readonly configurationService: ConfigurationService,
    @InjectPinoLogger(AssetWorkerService.name)
    private readonly logger: PinoLogger
  ) {}

  async discoverAssetsViaSteampipe(
    sourceId: string,
    subType?: AssetSubType
  ): Promise<any[]> {
    try {
      this.logger.info({ sourceId }, 'Discovering assets for source');

      const source = await this.sourcesService.findOne(sourceId);
      if (!source) {
        throw new NotFoundException('Source not found');
      }

      this.logger.info({ source }, 'Found source details');

      const steampipeUtils = new SteampipeUtils(this.logger);
      let assets = null;
      if (subType) {
        assets = await steampipeUtils.runSteampipeWorker(
          subType as unknown as AwsServiceAssetType,
          source
        );
      } else {
        assets = await steampipeUtils.discoverAwsResources(source);
      }

      this.logger.info(
        { count: assets.length },
        'Assets discovered successfully'
      );

      return assets;
    } catch (err) {
      this.logger.error({ err }, 'Error discovering assets');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error discovering assets');
    }
  }

  async discoverAssets(sourceId: string): Promise<string[]> {
    try {
      this.logger.info({ sourceId }, 'Discovering assets for source');

      const source = await this.sourcesService.findOne(sourceId);
      if (!source) {
        throw new NotFoundException('Source not found');
      }

      this.logger.info({ source }, 'Found source details');

      const cloudlistUtils = new CloudlistUtils(this.logger);
      const assets = await cloudlistUtils.runCloudList(source);

      this.logger.info(
        { count: assets.length },
        'Assets discovered successfully'
      );

      return assets;
    } catch (err) {
      this.logger.error({ err }, 'Error discovering assets');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error discovering assets');
    }
  }

  async getOpenPorts(hosts: string[]): Promise<PortScanResult[]> {
    try {
      this.logger.info({ hosts }, 'Getting open ports for hosts');

      const nmapUtils = new NmapUtils(this.logger);
      const results = await nmapUtils.runNmapScanBatch(hosts);

      this.logger.info({ results }, 'Open ports discovered successfully');

      return results;
    } catch (err) {
      this.logger.error({ err }, 'Error getting open ports');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error getting open ports');
    }
  }

  async getWebServers(getWebServersDto: GetWebServersDto[]): Promise<string[]> {
    try {
      const hosts = getWebServersDto.flatMap((host) =>
        host.ports.map((port) => [host.host, port].join(':'))
      );

      this.logger.info(
        { hosts, getWebServersDto },
        'Getting web servers for hosts'
      );

      const httpxUtils = new HttpxUtils(this.logger);
      const results = await httpxUtils.runHttpxWorker(hosts);

      this.logger.info({ results }, 'Web servers discovered successfully');

      return results;
    } catch (err) {
      this.logger.error({ err }, 'Error getting web servers');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error getting web servers');
    }
  }

  async checkWebapp(host: string): Promise<string> {
    try {
      this.logger.info({ host }, 'Checking for webapp');

      const httpxUtils = new HttpxUtils(this.logger);
      const results = await httpxUtils.runHttpxWorker([host]);

      this.logger.info({ results }, 'Web servers discovered successfully');

      return results.length ? results[0] : null;
    } catch (err) {
      this.logger.error({ err }, 'Error getting web servers');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error getting web servers');
    }
  }

  async getScreenshots(
    assetUrls: string[]
  ): Promise<{ path: string; metadata: string }[]> {
    try {
      if (!assetUrls || assetUrls.length === 0) {
        throw new BadRequestException('No asset URLs provided for screenshots');
      }

      // Process URLs: ensure lowercase and add http/https prefixes if missing
      const processedUrls = assetUrls.flatMap((url) => {
        const normalizedUrl = url.trim().toLowerCase();
        const urls = [];

        if (
          !normalizedUrl.startsWith('http://') &&
          !normalizedUrl.startsWith('https://')
        ) {
          urls.push(`http://${normalizedUrl}`, `https://${normalizedUrl}`);
        } else {
          urls.push(normalizedUrl);
        }

        return urls;
      });

      this.logger.info({ processedUrls }, 'Capturing screenshots for assets');

      const gowitnessUtils = new GowitnessUtils(this.logger);
      const screenshots = await gowitnessUtils.runGowitnessWorker(
        processedUrls
      );

      this.logger.info(
        { count: screenshots.length },
        'Screenshots captured successfully'
      );

      return screenshots;
    } catch (err) {
      this.logger.error({ err }, 'Error capturing screenshots');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error capturing screenshots');
    }
  }

  async getWebappApis(
    webappUrls: string[],
    outputApis = false
  ): Promise<string[]> {
    try {
      if (!webappUrls || webappUrls.length === 0) {
        throw new BadRequestException(
          'No web application URLs provided for API discovery'
        );
      }

      const crawlerConfig = await this.configurationService.findOne(
        DEFAULT_CRAWLER_CONFIG_UUID
      );
      const formConfig = await this.configurationService.findOne(
        DEFAULT_FORM_CONFIG_UUID
      );

      this.logger.info({ webappUrls }, 'Discovering APIs for web applications');

      const katanaUtils = new KatanaUtils(this.logger);
      const responseDir = await katanaUtils.runKatanaWorker(
        webappUrls,
        crawlerConfig.config,
        formConfig.config
      );

      this.logger.info({ responseDir }, 'API discovery completed successfully');

      if (outputApis) {
        const indexFilePath = path.join(responseDir, 'index.txt');
        const fileStream = fs.createReadStream(indexFilePath);

        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });

        const urls = [];
        for await (const line of rl) {
          const url = line.trim().split(' ')[1];
          if (url) {
            urls.push(url);
          }
        }

        return urls;
      }

      return [responseDir];
    } catch (err) {
      this.logger.error({ err }, 'Error discovering APIs');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error discovering APIs');
    }
  }

  async filterWebappApis(
    webappUrls: string[],
    outputApis = false
  ): Promise<string[]> {
    try {
      if (!webappUrls || webappUrls.length === 0) {
        throw new BadRequestException('No web application URLs provided');
      }

      this.logger.info({ webappUrls }, 'Filtering APIs for web applications');

      const uroUtils = new UroUtils(this.logger);
      const outputFile = await uroUtils.runUroWorker(webappUrls);

      this.logger.info({ outputFile }, 'API filtering completed successfully');

      if (outputApis) {
        const apis = await fs.promises.readFile(outputFile, 'utf-8');

        return apis.split('\n').filter((line) => line.trim());
      }

      return [outputFile];
    } catch (err) {
      this.logger.error({ err }, 'Error filtering APIs');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error filtering APIs');
    }
  }

  /**
   * Push source event to the message queue
   */
  async pushToQueue(body: SourceEventData) {
    const { sourceName, sourceType } = body;
    try {
      const message: CloudEvent<SourceEventData> = {
        data: body,
        id: UUID.v4(),
        source: 'api',
        specversion: '1.0',
        time: new Date(),
        type: `source.${sourceType}.added`,
      };

      await this.pubSubService.sendMessage<SourceEventData>(
        message.type,
        message,
        'asset-exchange',
        'asset-queue'
      );
      this.logger.info(
        { sourceName, sourceType, messageId: message.id },
        'Message pushed to queue'
      );
    } catch (err) {
      this.logger.error(
        { err, sourceName, sourceType },
        'Error pushing message to queue'
      );
      throw new Error('Failed to push message to queue');
    }
  }
}
