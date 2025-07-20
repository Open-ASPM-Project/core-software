import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsRelations,
  FindOptionsSelect,
  In,
  Like,
  Repository,
} from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CreateAssetDto,
  FilterKeyValue,
  FilterSearchQueryDto,
  PaginationRequestDto,
  PaginationResponseDto,
  UpdateAssetDto,
} from '@firewall-backend/dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AssetResponse,
  Filter,
  FilterValueCount,
} from '@firewall-backend/types';
import {
  AssetType,
  FilterType,
  ScanStatus,
  ScanTriggerType,
  ScheduleType,
  VulnerabilityProfiles,
} from '@firewall-backend/enums';
import { Asset, AssetScan, AssetScreenshot } from '@firewall-backend/entities';
import { AssetsUtils } from './assets.utils';
import { mapAssetResponse } from '@firewall-backend/utils';
import { ScheduleRunService } from '../schedules/schedule-run.service';
import * as fs from 'fs';

const defaultAssetRelations: FindOptionsRelations<Asset> = {
  assetToSources: true,
  addedBy: true,
  updatedBy: true,
  domainAsset: {
    vulnerabilities: true,
  },
  ipAsset: {
    vulnerabilities: true,
  },
  subdomainAsset: {
    domainAsset: true,
    vulnerabilities: true,
  },
  assetScreenshots: true,
  vulnerabilities: true,
  ec2SecurityGroups: {
    vulnerabilities: true,
  },
  ec2Webapps: {
    vulnerabilities: true,
  },
  webappAsset: {
    domainAsset: true,
    subdomainAsset: true,
    ipAsset: true,
    assetScreenshots: false,
    vulnerabilities: true,
  },
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly scheduleRunService: ScheduleRunService,
    private readonly assetsUtils: AssetsUtils,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetScreenshot)
    private readonly assetScreenshotRepository: Repository<AssetScreenshot>,
    @InjectRepository(AssetScan)
    private readonly assetScanRepository: Repository<AssetScan>,
    @InjectPinoLogger(AssetsService.name)
    private readonly logger: PinoLogger
  ) {}

  async bulkCreate(
    createAssetDtos: CreateAssetDto[],
    assetScanId: number = null,
    currentUserId: number = null,
    batchSize = 1
  ) {
    try {
      this.logger.info(
        { count: createAssetDtos.length, currentUserId },
        'Creating new assets'
      );

      const createdAssets: Asset[] = [];

      for (let i = 0; i < createAssetDtos.length; i += batchSize) {
        const batch = createAssetDtos.slice(i, i + batchSize);
        const promises = batch.map((createAssetDto) =>
          this.createAsset(createAssetDto, currentUserId, assetScanId)
        );
        const assets = await Promise.allSettled(promises);
        const successfulAssets = assets
          .filter(
            (result): result is PromiseFulfilledResult<Asset> =>
              result.status === 'fulfilled'
          )
          .map((result) => result.value);

        this.logger.info(
          {
            successCount: successfulAssets.length,
            failedCount: assets.length - successfulAssets.length,
          },
          'Batch completed successfully'
        );

        createdAssets.push(...successfulAssets);
      }

      this.logger.info({ count: createdAssets.length }, 'Created new assets');

      return createdAssets;
    } catch (err) {
      this.logger.error(
        {
          err,
          count: createAssetDtos.length,
          currentUserId,
        },
        'Error while creating assets'
      );

      throw new Error('Failed to create assets');
    }
  }

  async createAsset(
    createAssetDto: CreateAssetDto,
    currentUserId: number = null,
    assetScanId: number = null
  ): Promise<Asset> {
    try {
      this.logger.info(
        { type: createAssetDto.type, currentUserId },
        'Creating new asset'
      );

      const { type } = createAssetDto;

      let asset: Asset = null;
      switch (type) {
        case AssetType.DOMAIN:
          asset = await this.assetsUtils.createDomainAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        case AssetType.SUBDOMAIN:
          asset = await this.assetsUtils.createSubdomainAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        case AssetType.IP:
          asset = await this.assetsUtils.createIpAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        case AssetType.WEBAPP:
          asset = await this.assetsUtils.createWebappAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        case AssetType.WEBAPP_API:
          asset = await this.assetsUtils.createWebappApiAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        case AssetType.SERVICE:
          asset = await this.assetsUtils.createServiceAsset(
            createAssetDto,
            currentUserId,
            assetScanId
          );
          break;
        default:
          this.logger.error({ type }, 'Invalid asset type');
          throw new BadRequestException(`Invalid asset type: ${type}`);
      }

      this.logger.info({ type: asset.type }, 'Created new asset');

      const scheduleRun = await this.scheduleRunService.createScheduleRun({
        type: ScheduleType.VULNERABILITY_SCAN,
        assets: [asset],
        vulnerabilityProfiles: Object.values(VulnerabilityProfiles),
        triggerType: ScanTriggerType.ASSET_ADDED,
      });

      this.logger.info(
        { scheduleRunId: scheduleRun.id },
        'Created schedule run for asset'
      );

      return asset;
    } catch (err) {
      this.logger.error(
        {
          err,
          type: createAssetDto.type,
          currentUserId,
        },
        'Error while creating asset'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to create asset');
    }
  }

  async saveScreenshots(
    screenshots: { assetId: number; path: string; metadata: string }[]
  ) {
    try {
      this.logger.info({ count: screenshots.length }, 'Saving screenshots');

      const assetScreenshots: AssetScreenshot[] = [];
      for (const screenshot of screenshots) {
        const imageBuffer = await fs.promises.readFile(screenshot.path);
        assetScreenshots.push(
          this.assetScreenshotRepository.create({
            assetId: screenshot.assetId,
            image: imageBuffer, // Store the buffer directly for bytea column
            metadata: screenshot.metadata, // Keep metadata as a string
          })
        );
      }

      const results = await this.assetScreenshotRepository.save(
        assetScreenshots
      );

      this.logger.info(
        { count: results.length },
        'Screenshots saved successfully'
      );

      // Delete the screenshot files after saving to the database
      await Promise.all(
        screenshots.map(async (screenshot) => {
          await fs.promises.unlink(screenshot.path).catch((err) => {
            this.logger.warn(
              { path: screenshot.path, err },
              'Failed to delete screenshot file'
            );
          });
        })
      );

      return results;
    } catch (err) {
      this.logger.error({ err }, 'Error while saving screenshots');
      throw new Error('Failed to save screenshots');
    }
  }

  async createAssetScan(
    scanStatus: ScanStatus,
    scanType: ScanTriggerType,
    scheduleRunId?: number,
    userId?: number,
    sourceId?: number
  ) {
    this.logger.info(
      {
        scanStatus,
        scanType,
        scheduleRunId,
        userId,
        sourceId,
      },
      'Creating asset scan'
    );
    const assetScan = this.assetScanRepository.create({
      status: scanStatus,
      scanType,
      scheduleRunId,
      userId,
      sourceId,
    });
    return this.assetScanRepository.save(assetScan);
  }

  async updateAssetScan(assetScanId: number, updates: Partial<AssetScan>) {
    this.logger.info({ assetScanId, updates }, 'Updating asset scan');

    const assetScan = await this.assetScanRepository.findOne({
      where: { id: assetScanId },
    });
    if (!assetScan) {
      throw new NotFoundException('Asset scan not found');
    }

    return this.assetScanRepository.save({
      ...assetScan,
      ...updates,
    });
  }

  async findAll(
    paginationRequestDto: PaginationRequestDto,
    filters: FilterKeyValue[] = [],
    relations: FindOptionsRelations<Asset> = defaultAssetRelations,
    mapResponse = true
  ): Promise<PaginationResponseDto<Asset>> {
    try {
      this.logger.info({ paginationRequestDto, filters }, 'Getting all assets');

      const { page = 1, limit = 10 } = paginationRequestDto;

      const findOptions: FindManyOptions<Asset> = {
        where: { deleted: false },
        skip: (+page - 1) * +limit,
        take: limit,
        relations,
      };

      // applying filters
      filters.forEach((filterKeyValue) => {
        const filter = this.getFilterByFilterKey(filterKeyValue.filter_key);
        if (!filter) {
          throw new BadRequestException(
            `Invalid filter key: ${filterKeyValue.filter_key}`
          );
        }
        if (filterKeyValue.filter_key === 'sort_by') {
          findOptions.order = { [filterKeyValue.value]: 'ASC' };
        } else if (filterKeyValue.filter_key === 'order_by') {
          findOptions.order = {
            [Object.keys(findOptions.order)[0]]: filterKeyValue.value,
          };
        } else {
          const column = this.getColumnByFilterKey(filterKeyValue.filter_key);
          findOptions.where[column] =
            filter.type === FilterType.STRING && filter.searchable
              ? Like(`%${filterKeyValue.value}%`)
              : filterKeyValue.value;
        }
      });

      const [assets, totalCount] = await this.assetRepository.findAndCount(
        findOptions
      );
      let data = [];
      if (mapResponse) {
        for (const asset of assets) {
          const mappedAsset = mapAssetResponse(asset);
          data.push(mappedAsset);
        }
      } else {
        data = assets;
      }

      this.logger.info({ totalCount }, 'All assets and count');

      return {
        current_page: +page,
        current_limit: +limit,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / +limit),
        data: data,
      };
    } catch (err) {
      this.logger.error({ err }, 'Error while getting all assets');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get all assets');
    }
  }

  async findOneByUuid(
    assetId: string,
    select: FindOptionsSelect<Asset> = {},
    relations: FindOptionsRelations<Asset> = defaultAssetRelations,
    mapResponse = true
  ): Promise<Asset | AssetResponse> {
    try {
      this.logger.info({ assetId }, 'Getting asset');

      const asset = await this.assetRepository.findOne({
        select,
        where: { uuid: assetId, deleted: false },
        relations,
      });
      if (!asset) {
        this.logger.info({ assetId }, 'Asset not found');
        throw new NotFoundException('Asset not found');
      }

      this.logger.info({ asset: asset.name }, 'Assets found');

      if (mapResponse) {
        return mapAssetResponse(asset);
      }

      return asset;
    } catch (err) {
      this.logger.error({ err, assetId }, 'Error while getting asset');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get asset');
    }
  }

  async findByUuids(
    assetIds: string[],
    select: FindOptionsSelect<Asset> = {},
    relations: FindOptionsRelations<Asset> = defaultAssetRelations,
    mapResponse = true
  ): Promise<Asset[] | AssetResponse[]> {
    try {
      this.logger.info({ assetIds }, 'Getting assets');

      const assets = await this.assetRepository.find({
        select,
        where: { uuid: In(assetIds), deleted: false },
        relations,
      });

      this.logger.info(
        { assets: assets.map((asset) => asset.name) },
        'Assets found'
      );

      let data = [];
      if (mapResponse) {
        for (const asset of assets) {
          const mappedAsset = mapAssetResponse(asset);
          data.push(mappedAsset);
        }
      } else {
        data = assets;
      }

      return data;
    } catch (err) {
      this.logger.error({ err, assetIds }, 'Error while getting assets');

      throw new Error('Failed to get assets');
    }
  }

  async findOneById(assetId: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, deleted: false },
    });

    return asset;
  }

  async updateAsset(
    assetId: string,
    updateAssetDto: UpdateAssetDto,
    currentUserId: number
  ): Promise<AssetResponse> {
    try {
      this.logger.info({ assetId, updateAssetDto }, 'Updating asset base');

      const asset = await this.assetRepository.findOne({
        where: { uuid: assetId, deleted: false },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }

      this.logger.info({ asset }, 'Asset found');

      const updates: Partial<Asset> = {};

      if ([true, false].includes(updateAssetDto.active)) {
        updates.active = updateAssetDto.active;
      }
      if (updateAssetDto.name) {
        updates.name = updateAssetDto.name;
      }

      const updatedAsset = await this.assetRepository.save({
        ...asset,
        ...updates,
        updatedByUid: currentUserId,
      });

      this.logger.info({ updatedAsset }, 'Asset updated');

      const scheduleRun = await this.scheduleRunService.createScheduleRun({
        type: ScheduleType.VULNERABILITY_SCAN,
        assets: [updatedAsset],
        vulnerabilityProfiles: Object.values(VulnerabilityProfiles),
        triggerType: ScanTriggerType.ASSET_UPDATED,
      });

      this.logger.info(
        { scheduleRunId: scheduleRun.id },
        'Created schedule run for updated asset'
      );

      return mapAssetResponse(updatedAsset);
    } catch (err) {
      this.logger.error({ err, assetId }, 'Error while updating asset');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to update asset');
    }
  }

  async remove(assetId: string, currentUserId: number): Promise<AssetResponse> {
    try {
      this.logger.info({ assetId, currentUserId }, 'Deleting asset');

      const asset = await this.assetRepository.findOne({
        where: { uuid: assetId },
      });

      if (!asset) {
        throw new NotFoundException('Asset not found');
      }

      this.logger.info({ asset }, 'Asset found');

      const deletedAsset = await this.assetRepository.save({
        ...asset,
        deleted: true,
        updatedByUid: currentUserId,
      });

      this.logger.info({ deletedAsset }, 'Asset deleted');

      return mapAssetResponse(deletedAsset);
    } catch (err) {
      this.logger.error({ err, assetId }, 'Error while deleting asset');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to delete asset');
    }
  }

  getAvailableFilters(assetType: AssetType = null): Filter[] {
    const commonFilters = [
      {
        key: 'asset_type',
        label: 'Asset Type',
        type: FilterType.STRING,
        searchable: false,
      },
      {
        key: 'name',
        label: 'Name',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'active',
        label: 'Active',
        type: FilterType.BOOLEAN,
        searchable: false,
      },
      {
        key: 'deleted',
        label: 'Deleted',
        type: FilterType.BOOLEAN,
        searchable: false,
      },
      {
        key: 'sort_by',
        label: 'Sort By',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'order_by',
        label: 'Order By',
        type: FilterType.STRING,
        searchable: true,
      },
    ];

    const domainFilters = [
      ...commonFilters,
      {
        key: 'url',
        label: 'Domain URL',
        type: FilterType.STRING,
        searchable: true,
      },
    ];

    const subdomainFilters = [
      ...commonFilters,
      {
        key: 'url',
        label: 'Subdomain URL',
        type: FilterType.STRING,
        searchable: true,
      },
    ];

    const ipFilters = [
      ...commonFilters,
      {
        key: 'ip_type',
        label: 'IP Type',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'ip',
        label: 'IP Address',
        type: FilterType.STRING,
        searchable: true,
      },
    ];

    const webappFilters = [
      ...commonFilters,
      {
        key: 'url',
        label: 'Webapp URL',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'port',
        label: 'Port',
        type: FilterType.INTEGER,
        searchable: true,
      },
    ];

    if (assetType) {
      switch (assetType) {
        case AssetType.DOMAIN:
          return domainFilters;
        case AssetType.SUBDOMAIN:
          return subdomainFilters;
        case AssetType.IP:
          return ipFilters;
        case AssetType.WEBAPP:
          return webappFilters;
        default:
          throw new BadRequestException(`Invalid asset type: ${assetType}`);
      }
    } else {
      return [
        ...domainFilters,
        ...subdomainFilters,
        ...ipFilters,
        ...webappFilters,
      ];
    }
  }

  getFilterByFilterKey(filterKey: string): Filter {
    return this.getAvailableFilters().find(
      (filter) => filter.key === filterKey
    );
  }

  getColumnByFilterKey(filterKey: string): keyof Asset {
    let column: keyof Asset;
    switch (filterKey) {
      case 'asset_type':
        column = 'type';
        break;
      case 'name':
        column = 'name';
        break;
      case 'url':
        column = 'url';
        break;
      case 'ip_type':
        column = 'ipType';
        break;
      case 'ip_address':
        column = 'ipAddress';
        break;
      case 'port':
        column = 'port';
        break;
      case 'active':
        column = 'active';
        break;
      default:
        throw new BadRequestException(`Invalid filter key: ${filterKey}`);
    }
    return column;
  }

  async getFilterValues(
    filterKey: string,
    filterSearchQueryDto: FilterSearchQueryDto
  ): Promise<FilterValueCount> {
    try {
      const { page = 1, limit = 10, search } = filterSearchQueryDto;

      this.logger.info(
        {
          filterKey,
          filterSearchQueryDto,
        },
        'Getting asset filter values'
      );

      switch (filterKey) {
        case 'sort_by':
          return {
            values: [
              'assetType',
              'name',
              'url',
              'ipType',
              'ipAddress',
              'port',
              'active',
              'createdAt',
              'updatedAt',
            ],
            total_count: 9,
          };
        case 'order_by':
          return {
            values: ['ASC', 'DESC'],
            total_count: 2,
          };
      }

      const column = this.getColumnByFilterKey(filterKey);
      const findOptions: FindManyOptions<Asset> = {
        select: [column],
        where: { deleted: false },
        take: limit,
        skip: (page - 1) * limit,
      };

      const filter = this.getFilterByFilterKey(filterKey);
      if (filter.searchable && search) {
        findOptions.where[column] = Like(`%${search}%`);
      }

      const values = await this.assetRepository.find(findOptions);
      const uniqueValues = [...new Set(values.map((value) => value[column]))];

      return {
        values: uniqueValues,
        total_count: uniqueValues.length,
      };
    } catch (err) {
      this.logger.error(
        { err, filterKey, filterSearchQueryDto },
        'Error getting filter values'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get filter values');
    }
  }
}
