import {
  CloudEvent,
  MessagePubSubService,
} from '@firewall-backend/message-pub-sub';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AssetsService } from '../assets/assets.service';
import {
  CreateAssetDto,
  SourceEventData,
  WebappAssetEventData,
} from '@firewall-backend/dto';
import {
  AwsServiceAssetType,
  AssetSubType,
  AssetType,
  CloudType,
  ScanStatus,
  SourceType,
} from '@firewall-backend/enums';
import { isInt } from 'class-validator';
import { Asset, AssetScan } from '@firewall-backend/entities';
import { buildAssetDto } from '@firewall-backend/utils';
import { AssetWorkerService } from './asset.worker.service';
import { SourcesService } from '../sources/sources.service';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

@Injectable()
export class AssetWorker implements OnModuleInit {
  constructor(
    private readonly pubSubService: MessagePubSubService,
    private readonly assetsService: AssetsService,
    private readonly sourcesService: SourcesService,
    private readonly assetWorkerService: AssetWorkerService,
    @InjectPinoLogger(AssetWorker.name)
    private readonly logger: PinoLogger
  ) {}

  async onModuleInit() {
    this.logger.info({}, 'Initializing AssetsWorker');
    try {
      await Promise.all([
        await this.pubSubService.receiveMessage(
          {
            topics: Object.values(SourceType).flatMap((type) => [
              `source.${type}.added`,
              `source.${type}.updated`,
            ]),
            exchangeName: 'asset-exchange',
            queueName: 'asset-queue',
          },

          this.handleMessage.bind(this)
        ),
        this.pubSubService.receiveMessage(
          {
            topics: ['webapp.added', 'webapp.updated'],
            exchangeName: 'asset-exchange',
            queueName: 'webapp-asset-queue',
          },
          this.handleWebappAssetMessage.bind(this)
        ),
      ]);
      this.logger.info('AssetsWorker is now listening for messages');
    } catch (error) {
      this.logger.error({ error }, 'Error initializing AssetsWorker');
    }
  }

  sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  private async handleMessage(msg: CloudEvent<SourceEventData>) {
    this.logger.info({ ...msg.data }, 'Received source message');

    const { sourceId, scanType, scanCreatedBy, scheduleRunId, assetScanId } =
      msg.data;

    let assetScan: AssetScan = null;
    if (!assetScanId) {
      assetScan = await this.assetsService.createAssetScan(
        ScanStatus.PENDING,
        scanType,
        scheduleRunId,
        scanCreatedBy,
        sourceId
      );

      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        startTime: Date.now(),
      });

      this.logger.info({ assetScan }, 'Created asset scan');
    } else {
      assetScan = await this.assetsService.updateAssetScan(assetScanId, {
        status: ScanStatus.IN_PROGRESS,
      });
    }

    try {
      const source = await this.sourcesService.findOneById(sourceId);

      if (!source) {
        this.logger.error({ sourceId }, 'Source not found');
        throw new NotFoundException('Source not found');
      }

      this.logger.info({ assetScan }, 'Asset scan created');

      // remove when other types are added
      if (source.type !== SourceType.CLOUD) {
        this.logger.error({ sourceId }, 'Source is not a cloud source');
        throw new BadRequestException('Source is not a cloud source');
      }

      const allAssets: Asset[] = [];
      switch (source.cloudType) {
        case CloudType.AWS: {
          this.logger.info({ source }, 'Discovering assets for AWS source');
          const resources =
            await this.assetWorkerService.discoverAssetsViaSteampipe(
              source.uuid
            );

          // saving resources
          const assetDtos = await this.getAwsServiceAssetDtos(
            resources,
            source.uuid,
            assetScan.id
          );
          const assets = await this.assetsService.bulkCreate(
            assetDtos,
            assetScan.id
          );

          this.logger.info(
            { assetCount: assets.length },
            'Created assets from steampipe'
          );
          break;
        }
        default: {
          const cloudlistAssets = await this.assetWorkerService.discoverAssets(
            source.uuid
          );
          this.logger.info(
            { cloudlistAssets },
            'Retrieved assets from cloudlist'
          );

          const openPorts = await this.assetWorkerService.getOpenPorts(
            cloudlistAssets
          );
          this.logger.info({ openPorts }, 'Retrieved open ports from nmap');

          const webappAssets = await this.assetWorkerService.getWebServers(
            openPorts
          );
          this.logger.info(
            { webappAssets },
            'Retrieved web servers from httpx'
          );

          const dtos = [...cloudlistAssets, ...webappAssets].map((asset) =>
            buildAssetDto(asset, source.uuid)
          );
          allAssets.push(
            ...(await this.assetsService.bulkCreate(dtos, assetScan.id))
          );

          this.logger.info(
            { assetCount: allAssets.length },
            'Created assets from cloudlist'
          );
        }
      }

      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        status: ScanStatus.COMPLETED,
        endTime: Date.now(),
      });

      this.logger.info(
        { assetScan, duration: assetScan.endTime - assetScan.startTime },
        'Asset scan completed'
      );

      return assetScan;
    } catch (err) {
      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        status: ScanStatus.FAILED,
        endTime: Date.now(),
      });

      this.logger.error(
        { err, msg, assetScan },
        'Error processing asset message'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error processing asset message');
    }
  }

  private async handleWebappAssetMessage(
    msg: CloudEvent<WebappAssetEventData>
  ) {
    this.logger.info({ ...msg.data }, 'Received webapp asset message');

    const {
      webappId,
      scanType,
      scanCreatedBy,
      scheduleRunId,
      assetScanId,
      sourceId,
    } = msg.data;

    let assetScan: AssetScan = null;
    if (!assetScanId) {
      assetScan = await this.assetsService.createAssetScan(
        ScanStatus.PENDING,
        scanType,
        scheduleRunId,
        scanCreatedBy
      );

      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        startTime: Date.now(),
      });

      this.logger.info({ assetScan }, 'Created asset scan');
    } else {
      assetScan = await this.assetsService.updateAssetScan(assetScanId, {
        status: ScanStatus.IN_PROGRESS,
      });
    }

    try {
      const source = await this.sourcesService.findOneById(sourceId);

      const webapp = await this.assetsService.findOneById(webappId);
      const webappName = webapp.name;

      // checking for webapp with httpx
      const webappUrl = await this.assetWorkerService.checkWebapp(webapp.url);

      if (!webappUrl) {
        this.logger.error({ webappUrl, webappName }, 'URL is not of webapp');
        throw new BadRequestException('URL is not of webapp');
      }

      // getting screenshot
      const screenshots = await this.assetWorkerService.getScreenshots([
        webappUrl,
      ]);

      const assetScreenshots = await this.assetsService.saveScreenshots(
        screenshots.map((screenshot) => {
          return {
            assetId: webapp.id,
            path: screenshot.path,
            metadata: screenshot.metadata,
          };
        })
      );

      this.logger.info(
        { webappId, count: assetScreenshots.length, webappName },
        'Saved screenshots for webapp'
      );

      // getting webapp apis
      const [responseDir] = await this.assetWorkerService.getWebappApis([
        webappUrl,
      ]);

      const indexFilePath = path.join(responseDir, 'index.txt');
      const fileStream = fs.createReadStream(indexFilePath);

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      const apis: { path: string; url: string }[] = [];
      for await (const line of rl) {
        const [path, url] = line
          .trim()
          .split(' ', 2)
          .map((item) => item.trim());
        if (path && url) {
          apis.push({ path, url });
        }
      }

      this.logger.info(
        { webappId, count: apis.length, webappName },
        'Discovered APIs for webapp'
      );

      // filtering apis with uro
      const filteredApis = await this.filterWebappApis(apis);

      this.logger.info(
        { webappId, count: filteredApis.length, webappName },
        'Filtered APIs for webapp'
      );

      const assetDtos: CreateAssetDto[] = [];
      for (const api of filteredApis) {
        const dataFilePath = api.path;

        try {
          await fs.promises.access(dataFilePath, fs.constants.F_OK);

          const data = (await fs.promises.readFile(dataFilePath)).toString(
            'utf-8'
          );
          const [url, curlRequest, curlResponse, ...metadataParts] = data
            .trim()
            .split(/\n\s*\n/);
          const metadata = metadataParts.join('\n\n');

          assetDtos.push({
            type: AssetType.WEBAPP_API,
            active: true,
            sourceId: source?.uuid,
            webappApi: {
              url: url?.trim(),
              curlRequest: curlRequest?.trim(),
              curlResponse: curlResponse?.trim(),
              metadata: metadata?.trim(),
            },
          });
        } catch (err) {
          this.logger.error({ dataFilePath, err }, 'File does not exist');
          continue;
        }
      }

      // Clean up katana output files
      try {
        await fs.promises.rm(path.dirname(responseDir), {
          recursive: true,
          force: true,
        });
        this.logger.info('Ouput files deleted successfully');
      } catch (cleanupError) {
        this.logger.error({ cleanupError }, 'Error deleting output files');
      }

      const assets = await this.assetsService.bulkCreate(
        assetDtos,
        assetScan.id,
        null,
        10
      );

      this.logger.info(
        { count: assets.length },
        'APIs discovered successfully'
      );

      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        status: ScanStatus.COMPLETED,
        endTime: Date.now(),
      });

      this.logger.info(
        { assetScan, duration: assetScan.endTime - assetScan.startTime },
        'Asset scan completed'
      );

      return assetScan;
    } catch (err) {
      assetScan = await this.assetsService.updateAssetScan(assetScan.id, {
        status: ScanStatus.FAILED,
        endTime: Date.now(),
      });

      this.logger.error(
        { err, msg, assetScan },
        'Error processing webapp asset message'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error processing webapp asset message');
    }
  }

  private async filterWebappApis(apis: { path: string; url: string }[]) {
    const [uroOutputFile] = await this.assetWorkerService.filterWebappApis(
      apis.map((api) => api.url)
    );
    const fileStreamUro = fs.createReadStream(uroOutputFile);

    const rlUro = readline.createInterface({
      input: fileStreamUro,
      crlfDelay: Infinity,
    });

    const filteredApis: { path: string; url: string }[] = [];
    for await (const line of rlUro) {
      const url = line.trim();
      const u1 = url.endsWith('/') ? url : url + '/';

      let found = false;
      for (const api of apis) {
        if (found) break;

        const u2 = api.url.endsWith('/') ? api.url : api.url + '/';
        if (u1 === u2) {
          filteredApis.push(api);
          found = true;
        }
      }
    }

    // Clean up uro output files
    try {
      await fs.promises.rm(path.dirname(uroOutputFile), {
        recursive: true,
        force: true,
      });
      this.logger.info('Uro output files deleted successfully');
    } catch (cleanupError) {
      this.logger.error({ cleanupError }, 'Error deleting Uro output files');
    }

    return filteredApis;
  }

  private async getAwsServiceAssetDtos(
    resources: any[],
    sourceId: string,
    assetScanId: number = null
  ) {
    const assetDtos: CreateAssetDto[] = [];

    for (const key of Object.values(AwsServiceAssetType)) {
      const resource = resources[key];

      this.logger.info({ key }, 'Creating assets for resource type');

      if (resource.length > 0) {
        const subType = key as unknown as AssetSubType;

        for (let i = 0; i < resource.length; i++) {
          const metadata = resource[i];

          const assetDto: CreateAssetDto = {
            active: true,
            type: AssetType.SERVICE,
            sourceId,
            service: {
              subType,
              metadata: JSON.stringify(metadata),
            },
          };

          switch (subType) {
            case AssetSubType.AWS_API_GATEWAY_REST_API:
            case AssetSubType.AWS_API_GATEWAY_STAGE: {
              const apiMetadata =
                resources[AwsServiceAssetType.AWS_API_GATEWAY_REST_API][i];
              const stageMetadata =
                resources[AwsServiceAssetType.AWS_API_GATEWAY_STAGE][i];

              const apiGatewayUrl = `https://${apiMetadata?.api_id}.execute-api.${apiMetadata?.region}.amazonaws.com/${stageMetadata?.name}`;

              assetDto.service.awsApiGatewayRestApi = {
                apiGatewayUrl,
              };
              assetDto.service.awsApiGatewayStage = {
                apiGatewayUrl,
              };
              break;
            }
            case AssetSubType.AWS_EC2_APPLICATION_LOAD_BALANCER:
              assetDto.service.awsEc2ApplicationLoadBalancer = {
                dnsName: metadata?.dns_name,
              };
              break;
            case AssetSubType.AWS_EC2_CLASSIC_LOAD_BALANCER:
              assetDto.service.awsEc2ClassicLoadBalancer = {
                dnsName: metadata?.dns_name,
              };
              break;
            case AssetSubType.AWS_EC2_GATEWAY_LOAD_BALANCER:
              assetDto.service.awsEc2GatewayLoadBalancer = {
                dnsName: metadata?.dns_name,
              };
              break;
            case AssetSubType.AWS_VPC_SECURITY_GROUP: {
              const ipPermissions: { FromPort: number }[] =
                metadata?.ip_permissions
                  ? JSON.parse(metadata?.ip_permissions)
                  : [];
              const fromPorts = [];
              for (const ipPermission of ipPermissions) {
                if (isInt(ipPermission.FromPort)) {
                  fromPorts.push(ipPermission.FromPort);
                }
              }

              assetDto.service.awsVpcSecurityGroup = {
                groupId: metadata?.group_id,
                groupName: metadata?.group_name,
                fromPorts,
              };
              break;
            }
            case AssetSubType.AWS_EC2_INSTANCE: {
              const sgResource =
                resources[AwsServiceAssetType.AWS_VPC_SECURITY_GROUP];

              const sgDtos: CreateAssetDto[] = [];
              for (const sg of sgResource) {
                const sgDto: CreateAssetDto = {
                  active: true,
                  type: AssetType.SERVICE,
                  sourceId,
                  service: {
                    subType: AssetSubType.AWS_VPC_SECURITY_GROUP,
                    metadata: JSON.stringify(metadata),
                  },
                };

                const ipPermissions: { FromPort: number }[] = sg?.ip_permissions
                  ? JSON.parse(sg?.ip_permissions)
                  : [];
                const fromPorts = [];
                for (const ipPermission of ipPermissions) {
                  if (isInt(ipPermission.FromPort)) {
                    fromPorts.push(ipPermission.FromPort);
                  }
                }

                sgDto.service.awsVpcSecurityGroup = {
                  groupId: sg?.group_id,
                  groupName: sg?.group_name,
                  fromPorts,
                };

                sgDtos.push(sgDto);
              }

              const sgAssets = await this.assetsService.bulkCreate(
                sgDtos,
                assetScanId,
                null,
                10
              );

              const ec2Sgs: { GroupId: string; GroupName: string }[] =
                JSON.parse(metadata?.security_groups);
              const uuids = [];
              for (const sg of ec2Sgs) {
                for (const asset of sgAssets) {
                  if (asset.securityGroupId === sg.GroupId) {
                    uuids.push(asset.uuid);
                  }
                }
              }

              assetDto.service.awsEc2Instance = {
                publicDnsName: metadata?.public_dns_name,
                publicIpAddress: metadata?.public_ip_address,
                securityGroups: uuids,
              };

              break;
            }
            case AssetSubType.AWS_RDS_DB_INSTANCE: {
              assetDto.service.awsRdsDbInstance = {
                endpointAddress: metadata?.endpoint_address,
                endpointPort: metadata?.endpoint_port,
              };
              break;
            }
            case AssetSubType.AWS_ROUTE53_RECORD: {
              assetDto.service.awsRoute53Record = {
                name: metadata?.name,
              };
              break;
            }
            case AssetSubType.AWS_S3_BUCKET: {
              assetDto.service.awsS3Bucket = {
                name: metadata?.name,
              };
              break;
            }
            default:
              this.logger.error({ subType }, 'Invalid asset subtype');
              throw new BadRequestException('Invalid asset subtype');
          }

          assetDtos.push(assetDto);
        }
      }
    }

    this.logger.info({ count: assetDtos.length }, 'Service asset dtos');

    return assetDtos;
  }
}
