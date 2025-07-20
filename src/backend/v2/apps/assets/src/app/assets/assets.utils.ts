import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AwsServiceAssetType,
  AssetType,
  IpType,
  ScanTriggerType,
  ScheduleType,
  AssetSubType,
} from '@firewall-backend/enums';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getHostname, getDomain, getSubdomain } from 'tldts';
import { In, Repository } from 'typeorm';
import { isIP, isIPv4 } from 'net';
import { CreateAssetDto, CreateServiceDto } from '@firewall-backend/dto';
import {
  Asset,
  AssetToSource,
  Ec2ToSecurityGroup,
  Ec2ToWebapp,
  Source,
} from '@firewall-backend/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { buildAssetDto } from '@firewall-backend/utils';
import { SourcesService } from '../sources/sources.service';
import { ScheduleRunService } from '../schedules/schedule-run.service';

@Injectable()
export class AssetsUtils {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly scheduleRunService: ScheduleRunService,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetToSource)
    private readonly assetToSourceRepository: Repository<AssetToSource>,
    @InjectRepository(Ec2ToSecurityGroup)
    private readonly ec2ToSecurityGroupRepository: Repository<Ec2ToSecurityGroup>,
    @InjectRepository(Ec2ToWebapp)
    private readonly ec2ToWebappRepository: Repository<Ec2ToWebapp>,
    @InjectPinoLogger(AssetsUtils.name)
    private readonly logger: PinoLogger
  ) {}

  async createAssetToSource(
    assetId: number,
    sourceId: string,
    currentUserId: number
  ) {
    if (!assetId || !sourceId) {
      this.logger.error({ assetId, sourceId }, 'Asset or source ID is missing');
      return null;
    }

    this.logger.info(
      { assetId, sourceId, currentUserId },
      'Creating asset to source'
    );

    const source: Source = sourceId
      ? await this.sourcesService.findOne(sourceId)
      : null;

    const assetToSource = await this.assetToSourceRepository.findOne({
      where: { assetId, sourceId: source.id },
    });

    if (assetToSource) {
      this.logger.error({ assetToSource }, 'Asset to source already exists');
      return assetToSource;
    }

    const newAssetToSource = await this.assetToSourceRepository.save({
      assetId,
      sourceId: source.id,
      addedByUid: currentUserId,
    });

    this.logger.info({ newAssetToSource }, 'Asset to source created');

    return newAssetToSource;
  }

  async createDomainAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    const url = createAssetDto.domain?.url;

    const newAsset: Partial<Asset> = {
      type: AssetType.DOMAIN,
      active: createAssetDto.active,
      deleted: false,
      assetScanId,
      updatedByUid: currentUserId,
    };
    const hostname = getHostname(url);
    const domain = getDomain(url);

    this.logger.info({ domain }, 'Extracted domain');

    if (!domain) {
      this.logger.error({ domain }, 'Invalid domain URL');
      throw new BadRequestException('Invalid domain URL');
    }

    const existingAsset: Asset =
      (await this.assetRepository.findOneBy({
        type: AssetType.DOMAIN,
        url: domain,
      })) ?? ({} as Asset);

    newAsset.url = domain;
    newAsset.name = createAssetDto.name ?? hostname;
    newAsset.addedByUid = existingAsset.addedByUid ?? currentUserId;

    const asset = await this.assetRepository.save({
      ...existingAsset,
      ...newAsset,
    });
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );

    this.logger.info({ assetToSource }, 'Asset to source created');
    return asset;
  }

  async createSubdomainAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    const url = createAssetDto.subdomain?.url;

    const newAsset: Partial<Asset> = {
      type: AssetType.SUBDOMAIN,
      active: createAssetDto.active,
      deleted: false,
      assetScanId,
      updatedByUid: currentUserId,
    };
    const hostname = getHostname(url);
    const domain = getDomain(url);
    const subDomain = getSubdomain(url);

    this.logger.info({ domain, subDomain }, 'Extracted domain and subdomain');

    if (!domain || !subDomain || subDomain === 'www') {
      this.logger.error({ domain }, 'Invalid subdomain URL');
      throw new BadRequestException('Invalid subdomain URL');
    }

    const existingAsset: Asset =
      (await this.assetRepository.findOneBy({
        type: AssetType.SUBDOMAIN,
        url: hostname,
      })) ?? ({} as Asset);

    const domainAsset = await this.createDomainAsset(
      buildAssetDto(domain, createAssetDto.sourceId),
      currentUserId,
      assetScanId
    );

    newAsset.url = hostname;
    newAsset.domainId = domainAsset.id;
    newAsset.name = createAssetDto.name ?? subDomain;
    newAsset.addedByUid = existingAsset.addedByUid ?? currentUserId;

    const asset = await this.assetRepository.save({
      ...existingAsset,
      ...newAsset,
    });
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );

    this.logger.info({ assetToSource }, 'Asset to source created');
    return asset;
  }

  async createIpAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    const ip = createAssetDto.ip?.ip;

    const newAsset: Partial<Asset> = {
      type: AssetType.IP,
      active: createAssetDto.active,
      deleted: false,
      assetScanId,
      updatedByUid: currentUserId,
    };
    const ipAddress = getHostname(ip);

    this.logger.info({ ipAddress }, 'Extracted IP address');

    if (!ipAddress || !isIP(ipAddress)) {
      this.logger.error({ ipAddress }, 'Invalid IP address');
      throw new BadRequestException('Invalid IP address');
    }

    const existingAsset: Asset =
      (await this.assetRepository.findOneBy({
        type: AssetType.IP,
        ipAddress: ipAddress,
      })) ?? ({} as Asset);

    newAsset.ipType = isIPv4(ipAddress) ? IpType.IPV4 : IpType.IPV6;
    newAsset.ipAddress = ipAddress;
    newAsset.name = createAssetDto.name ?? ipAddress;
    newAsset.addedByUid = existingAsset.addedByUid ?? currentUserId;

    const asset = await this.assetRepository.save({
      ...existingAsset,
      ...newAsset,
    });
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );

    this.logger.info({ assetToSource }, 'Asset to source created');
    return asset;
  }

  async createWebappAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null,
    scheduleRun = true
  ): Promise<Asset> {
    const url = createAssetDto.webapp?.url;

    this.logger.info({ url }, 'Creating webapp asset');

    const newAsset: Partial<Asset> = {
      type: AssetType.WEBAPP,
      active: createAssetDto.active,
      deleted: false,
      assetScanId,
      updatedByUid: currentUserId,
    };
    const hostname = getHostname(url);

    this.logger.info({ hostname }, 'Extracted hostname');

    const port = new URL(
      !url.startsWith('http://') && !url.startsWith('https://')
        ? `http://${url}`
        : url
    ).port;
    newAsset.port = port ? parseInt(port, 10) : null;

    let existingAsset: Asset = null;
    const assetDto = buildAssetDto(hostname, createAssetDto.sourceId);
    const assetType = assetDto.type;
    if (assetType === AssetType.UNKNOWN) {
      this.logger.error({ assetType, hostname }, 'Unknown asset type');
      throw new BadRequestException('Unknown asset type');
    }

    if (assetType === AssetType.IP) {
      const ipAsset = await this.createIpAsset(
        assetDto,
        currentUserId,
        assetScanId
      );

      existingAsset =
        (await this.assetRepository.findOneBy({
          type: AssetType.WEBAPP,
          port: newAsset.port,
          ipId: ipAsset.id,
        })) ?? ({} as Asset);

      newAsset.ipId = ipAsset.id;
    } else if (assetType === AssetType.SUBDOMAIN) {
      const subDomain = getSubdomain(url);

      this.logger.info({ subDomain }, 'Extracted domain and subdomain');

      const subDomainAsset = await this.createSubdomainAsset(
        assetDto,
        currentUserId,
        assetScanId
      );

      existingAsset =
        (await this.assetRepository.findOneBy({
          type: AssetType.WEBAPP,
          port: newAsset.port,
          subdomainId: subDomainAsset.id,
        })) ?? ({} as Asset);

      newAsset.subdomainId = subDomainAsset.id;
    } else if (assetType === AssetType.DOMAIN) {
      const domainAsset = await this.createDomainAsset(
        assetDto,
        currentUserId,
        assetScanId
      );

      existingAsset =
        (await this.assetRepository.findOneBy({
          type: AssetType.WEBAPP,
          port: newAsset.port,
          domainId: domainAsset.id,
        })) ?? ({} as Asset);

      newAsset.domainId = domainAsset.id;
    }

    newAsset.name =
      createAssetDto.name ?? newAsset.port
        ? `${hostname}:${newAsset.port}`
        : hostname;
    newAsset.url = existingAsset.url ?? url;
    newAsset.addedByUid = existingAsset.addedByUid ?? currentUserId;

    this.logger.info({ url }, 'Created webapp asset');

    const asset = await this.assetRepository.save({
      ...existingAsset,
      ...newAsset,
    });
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );

    this.logger.info({ assetToSource }, 'Asset to source created');

    if (scheduleRun) {
      // sending for webapp scan
      const scheduleRun = await this.scheduleRunService.createScheduleRun({
        type: ScheduleType.WEBAPP_ASSET_SCAN,
        assets: [asset],
        currentUserId,
        triggerType: existingAsset.id
          ? ScanTriggerType.ASSET_UPDATED
          : ScanTriggerType.ASSET_ADDED,
        assetScanId,
        sourceId: assetToSource?.sourceId,
      });

      this.logger.info(
        { scheduleRunId: scheduleRun.id },
        'Schedule run for webapp scan created'
      );
    }

    return asset;
  }

  async createWebappApiAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    const url = createAssetDto.webappApi?.url;

    this.logger.info({ url }, 'Creating webapp API asset');

    const newAsset: Partial<Asset> = {
      type: AssetType.WEBAPP_API,
      active: createAssetDto.active,
      deleted: false,
      url,
      curlRequest: createAssetDto.webappApi?.curlRequest,
      curlResponse: createAssetDto.webappApi?.curlResponse,
      metadata: createAssetDto.webappApi?.metadata,
      assetScanId,
      updatedByUid: currentUserId,
    };

    const existingAsset: Asset =
      (await this.assetRepository.findOneBy({
        type: AssetType.WEBAPP_API,
        url,
      })) ?? ({} as Asset);

    const webappAsset = await this.createWebappAsset(
      {
        type: AssetType.WEBAPP,
        active: createAssetDto.active,
        sourceId: createAssetDto.sourceId,
        webapp: {
          url,
        },
      },
      currentUserId,
      assetScanId,
      false
    );
    newAsset.webappId = webappAsset.id;

    newAsset.name = createAssetDto.name ?? url;
    newAsset.addedByUid = existingAsset.addedByUid ?? currentUserId;

    this.logger.info({ name: newAsset.name }, 'Created webapp API asset');

    const asset = await this.assetRepository.save({
      ...existingAsset,
      ...newAsset,
    });
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );
    this.logger.info({ assetToSource }, 'Asset to source created');
    return asset;
  }

  async createServiceAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    const createServiceDto: CreateServiceDto = createAssetDto.service;
    if (!createServiceDto) {
      this.logger.error({ createAssetDto }, 'Service is required');
      throw new BadRequestException('Service is required');
    }

    let newAsset: Partial<Asset> = {
      type: AssetType.SERVICE,
      subType: createServiceDto.subType,
      active: createAssetDto.active,
      deleted: false,
      metadata: createServiceDto.metadata,
      assetScanId,
      updatedByUid: currentUserId,
    };

    const subType = createServiceDto?.subType;
    if (
      Object.values(AwsServiceAssetType).includes(
        subType as unknown as AwsServiceAssetType
      )
    ) {
      newAsset = await this.createAwsServiceAsset(
        createServiceDto,
        newAsset,
        createAssetDto.sourceId
      );
    } else {
      this.logger.error({ subType }, 'Invalid subType');
      throw new BadRequestException('Invalid subType');
    }

    this.logger.info({ name: newAsset.name }, 'Created service asset');

    newAsset.name = createAssetDto.name ?? newAsset.name;
    const asset = await this.assetRepository.save(newAsset);
    const assetToSource = await this.createAssetToSource(
      asset.id,
      createAssetDto.sourceId,
      currentUserId
    );

    this.logger.info({ assetToSource }, 'Asset to source created');
    return asset;
  }

  async createAwsServiceAsset(
    createServiceDto: CreateServiceDto,
    newAsset: Partial<Asset>,
    sourceId: string
  ): Promise<Partial<Asset>> {
    const subType = createServiceDto?.subType as unknown as AwsServiceAssetType;
    if (!subType) {
      this.logger.error({ createServiceDto }, 'SubType is required');
      throw new BadRequestException('SubType is required');
    }

    if (!Object.values(AwsServiceAssetType).includes(subType)) {
      this.logger.error({ subType }, 'Invalid subType');
      throw new BadRequestException('Invalid subType');
    }

    let existingAsset = null;
    switch (subType) {
      case AwsServiceAssetType.AWS_EC2_INSTANCE: {
        newAsset.url = createServiceDto?.awsEc2Instance?.publicDnsName;
        newAsset.name = newAsset.url;
        newAsset.ipAddress = createServiceDto?.awsEc2Instance?.publicIpAddress;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        newAsset.ipId = (
          await this.createIpAsset(
            buildAssetDto(newAsset.ipAddress, sourceId),
            newAsset.updatedByUid,
            newAsset.assetScanId
          )
        )?.id;

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_EC2_INSTANCE as unknown as AssetSubType,
            url: newAsset.url,
            ipAddress: newAsset.ipAddress,
          })) ?? {};

        newAsset = await this.assetRepository.save({
          ...existingAsset,
          ...newAsset,
        });

        const securityGroups = await this.assetRepository.find({
          where: {
            uuid: In(createServiceDto?.awsEc2Instance?.securityGroups),
            deleted: false,
          },
        });

        this.logger.info(
          { sgCount: securityGroups.length },
          'Found security groups'
        );

        const securityGroupIds: number[] = [];
        const webappIds: number[] = [];
        for (const securityGroup of securityGroups) {
          securityGroupIds.push(securityGroup.id);
          const fromPorts = JSON.parse(
            securityGroup?.sgFromPorts ?? '[]'
          ) as number[];

          const assetDtos = fromPorts.map((port) =>
            buildAssetDto(`${newAsset.ipAddress}:${port}`, sourceId)
          );

          for (const assetDto of assetDtos) {
            const webappAsset = await this.createWebappAsset(
              assetDto,
              newAsset.updatedByUid,
              newAsset.assetScanId
            );
            webappIds.push(webappAsset.id);
          }
        }

        // linking security groups
        for (const securityGroupId of securityGroupIds) {
          await this.ec2ToSecurityGroupRepository.save({
            ec2AssetId: newAsset.id,
            securityGroupAssetId: securityGroupId,
          });
        }

        // linking webapps
        for (const webappId of webappIds) {
          await this.ec2ToWebappRepository.save({
            ec2AssetId: newAsset.id,
            webappAssetId: webappId,
          });
        }

        this.logger.info(
          { securityGroupIds, webappIds },
          'Linked security groups and webapps'
        );
        break;
      }
      case AwsServiceAssetType.AWS_VPC_SECURITY_GROUP: {
        newAsset.securityGroupId =
          createServiceDto?.awsVpcSecurityGroup?.groupId;
        newAsset.name = newAsset.securityGroupId;
        newAsset.securityGroupName =
          createServiceDto?.awsVpcSecurityGroup?.groupName;

        const fromPorts = createServiceDto?.awsVpcSecurityGroup?.fromPorts;
        if (fromPorts.length) {
          newAsset.sgFromPorts = JSON.stringify(fromPorts);
        }

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_VPC_SECURITY_GROUP as unknown as AssetSubType,
            securityGroupId: newAsset.securityGroupId,
            securityGroupName: newAsset.securityGroupName,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_EC2_APPLICATION_LOAD_BALANCER: {
        newAsset.url = createServiceDto?.awsEc2ApplicationLoadBalancer?.dnsName;
        newAsset.name = newAsset.url;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_EC2_APPLICATION_LOAD_BALANCER as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_EC2_CLASSIC_LOAD_BALANCER: {
        newAsset.url = createServiceDto?.awsEc2ClassicLoadBalancer?.dnsName;
        newAsset.name = newAsset.url;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_EC2_CLASSIC_LOAD_BALANCER as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_EC2_GATEWAY_LOAD_BALANCER: {
        newAsset.url = createServiceDto?.awsEc2GatewayLoadBalancer?.dnsName;
        newAsset.name = newAsset.url;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_EC2_GATEWAY_LOAD_BALANCER as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_RDS_DB_INSTANCE: {
        newAsset.url = createServiceDto?.awsRdsDbInstance?.endpointAddress;
        newAsset.port = createServiceDto?.awsRdsDbInstance?.endpointPort;
        newAsset.name = `${newAsset.url}:${newAsset.port}`;

        const webappAsset = await this.createWebappAsset(
          buildAssetDto(newAsset.name, sourceId),
          newAsset.updatedByUid,
          newAsset.assetScanId
        );
        newAsset.webappId = webappAsset.id;

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_RDS_DB_INSTANCE as unknown as AssetSubType,
            url: newAsset.url,
            port: newAsset.port,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_ROUTE53_RECORD: {
        newAsset.url = createServiceDto?.awsRoute53Record?.name;
        newAsset.name = newAsset.url;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_ROUTE53_RECORD as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_S3_BUCKET: {
        newAsset.url = `${createServiceDto?.awsS3Bucket?.name}.s3.amazonaws.com`;
        newAsset.name = createServiceDto?.awsS3Bucket?.name;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType:
              AwsServiceAssetType.AWS_S3_BUCKET as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      case AwsServiceAssetType.AWS_API_GATEWAY_REST_API:
      case AwsServiceAssetType.AWS_API_GATEWAY_STAGE: {
        newAsset.url =
          createServiceDto.awsApiGatewayRestApi?.apiGatewayUrl ||
          createServiceDto.awsApiGatewayStage?.apiGatewayUrl;
        newAsset.name = newAsset.url;

        newAsset = await this.createDnsNameAsset(
          newAsset.url,
          newAsset,
          sourceId,
          newAsset.updatedByUid,
          newAsset.assetScanId
        );

        existingAsset =
          (await this.assetRepository.findOneBy({
            subType: subType as unknown as AssetSubType,
            url: newAsset.url,
          })) ?? {};
        break;
      }
      default: {
        this.logger.error({ subType }, 'Invalid subType');
        throw new BadRequestException('Invalid subType');
      }
    }

    this.logger.info('Created new asset AWS service');

    newAsset.addedByUid = existingAsset.addedByUid ?? newAsset.updatedByUid;
    return {
      ...existingAsset,
      ...newAsset,
    };
  }

  async createDnsNameAsset(
    dnsName: string,
    newAsset: Partial<Asset>,
    sourceId?: string,
    currentUserId: number = null,
    assetScanId: number = null
  ) {
    const assetDto = buildAssetDto(dnsName, sourceId);

    const assetType = assetDto.type;
    switch (assetType) {
      case AssetType.DOMAIN:
        newAsset.domainId = (
          await this.createDomainAsset(assetDto, currentUserId, assetScanId)
        )?.id;
        break;
      case AssetType.SUBDOMAIN:
        newAsset.subdomainId = (
          await this.createSubdomainAsset(assetDto, currentUserId, assetScanId)
        )?.id;
        break;
      default:
        this.logger.error({ assetType, dnsName }, 'Invalid dns name');
    }

    return newAsset;
  }
}
