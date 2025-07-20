import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsSelect,
  In,
  Like,
  Repository,
} from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  FilterKeyValue,
  FilterSearchQueryDto,
  PaginationRequestDto,
  PaginationResponseDto,
} from '@firewall-backend/dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSourceDto } from './dto/sources.dto';
import { Filter, FilterValueCount } from '@firewall-backend/types';
import {
  CloudType,
  FilterType,
  ScanTriggerType,
  ScheduleType,
} from '@firewall-backend/enums';
import { Source } from '@firewall-backend/entities';
import { ScheduleRunService } from '../schedules/schedule-run.service';
import { SourcesUtils } from './sources.utils';

@Injectable()
export class SourcesService {
  constructor(
    private readonly scheduleRunService: ScheduleRunService,
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    @InjectPinoLogger(SourcesService.name)
    private readonly logger: PinoLogger
  ) {}

  getCloudTypeLabel(cloudType: CloudType): string {
    switch (cloudType) {
      case CloudType.AWS:
        return 'Amazon Web Services';
      case CloudType.AZURE:
        return 'Microsoft Azure';
      case CloudType.GCP:
        return 'Google Cloud Platform';
      case CloudType.ALIBABA:
        return 'Alibaba Cloud';
      case CloudType.DIGITAL_OCEAN:
        return 'DigitalOcean';
      case CloudType.HEROKU:
        return 'Heroku';
      case CloudType.LINODE:
        return 'Linode';
      case CloudType.SCALEWAY:
        return 'Scaleway';
      case CloudType.ARVANCLOUD:
        return 'Arvancloud';
      case CloudType.HETZNER:
        return 'Hetzner';
      case CloudType.CLOUDFLARE:
        return 'Cloudflare';
      case CloudType.NAMECHEAP:
        return 'Namecheap';
      case CloudType.DNSSIMPLE:
        return 'DNSimple';
      case CloudType.FASTLY:
        return 'Fastly';
      case CloudType.HASHICORP_CONSUL:
        return 'HashiCorp Consul';
      case CloudType.HASHICORP_NOMAD:
        return 'HashiCorp Nomad';
      case CloudType.KUBERNETES:
        return 'Kubernetes';
      case CloudType.TERRAFORM:
        return 'Terraform';
      default:
        return null;
    }
  }

  async createSource(
    createSourceDto: CreateSourceDto,
    currentUserId: number,
    upsert = false
  ): Promise<Source> {
    try {
      this.logger.info(
        { createSourceDto, currentUserId, upsert },
        'Creating new source base'
      );

      const { name } = createSourceDto;

      const source = await this.sourceRepository.findOne({
        where: { name },
      });

      if (source && !upsert) {
        throw new ConflictException(`Source ${name} already exists`);
      }

      if (upsert && !source) {
        this.logger.error({ name }, 'Source not found');
        throw new NotFoundException(`Source ${name} not found`);
      }

      // const sourcesUtils = new SourcesUtils(this.logger);
      // await sourcesUtils.validateCloudCredentials(createSourceDto.cloud);

      let newSource: Partial<Source> = {
        active: createSourceDto.active,
        addedByUid: currentUserId,
        cloudType: createSourceDto.cloud?.cloudType,
        cloudTypeLabel: this.getCloudTypeLabel(
          createSourceDto.cloud?.cloudType
        ),
        name: createSourceDto.name,
        type: createSourceDto.type,
        updatedByUid: currentUserId,
        alibabaAccessKey: createSourceDto.cloud?.alibaba?.alibabaAccessKey,
        alibabaAccessKeySecret:
          createSourceDto.cloud?.alibaba?.alibabaAccessKeySecret,
        alibabaRegionId: createSourceDto.cloud?.alibaba?.alibabaRegionId,
        apiKey: createSourceDto.cloud?.arvancloud?.apiKey,
        authToken: createSourceDto.cloud?.hetzner?.authToken,
        clientId: createSourceDto.cloud?.azure?.clientId,
        clientSecret: createSourceDto.cloud?.azure?.clientSecret,
        awsAccessKey: createSourceDto.cloud?.aws?.awsAccessKey,
        awsSecretKey: createSourceDto.cloud?.aws?.awsSecretKey,
        consulUrl: createSourceDto.cloud?.consul?.consulUrl,
        digitaloceanToken: createSourceDto.cloud?.do?.digitaloceanToken,
        dnssimpleApiToken: createSourceDto.cloud?.dnssimple?.dnssimpleApiToken,
        fastlyApiKey: createSourceDto.cloud?.fastly?.fastlyApiKey,
        email: createSourceDto.cloud?.cloudflare?.email,
        gcpServiceAccountKey: createSourceDto.cloud?.gcp?.gcpServiceAccountKey,
        herokuApiToken: createSourceDto.cloud?.heroku?.herokuApiToken,
        kubeconfigFile: createSourceDto.cloud?.kubernetes?.kubeconfigFile,
        kubeconfigEncoded: createSourceDto.cloud?.kubernetes?.kubeconfigEncoded,
        linodePersonalAccessToken:
          createSourceDto.cloud?.linode?.linodePersonalAccessToken,
        namecheapApiKey: createSourceDto.cloud?.namecheap?.namecheapApiKey,
        namecheapUserName: createSourceDto.cloud?.namecheap?.namecheapUserName,
        nomadUrl: createSourceDto.cloud?.nomad?.nomadUrl,
        tfStateFile: createSourceDto.cloud?.terraform?.tfStateFile,
        scalewayAccessKey: createSourceDto.cloud?.scw?.scalewayAccessKey,
        scalewayAccessToken: createSourceDto.cloud?.scw?.scalewayAccessToken,
        subscriptionId: createSourceDto.cloud?.azure?.subscriptionId,
        tenantId: createSourceDto.cloud?.azure?.tenantId,
      };

      if (upsert) {
        newSource = {
          ...source,
          ...newSource,
          updatedByUid: currentUserId,
        };
      }

      newSource = await this.sourceRepository.save(newSource);

      this.logger.info({ newSource, currentUserId }, 'Created new source base');

      const scheduleRun = await this.scheduleRunService.createScheduleRun({
        type: ScheduleType.ASSET_SCAN,
        sources: [newSource as Source],
        triggerType: upsert
          ? ScanTriggerType.SOURCE_UPDATED
          : ScanTriggerType.SOURCE_ADDED,
      });

      this.logger.info(
        { scheduleRunId: scheduleRun.id },
        'Created schedule run for source creation'
      );

      return newSource as Source;
    } catch (err) {
      this.logger.error(
        {
          err,
          createSourceDto,
          currentUserId,
        },
        'Error while creating source'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to create source');
    }
  }

  async findAll(
    paginationRequest: PaginationRequestDto,
    filters: FilterKeyValue[] = []
  ): Promise<PaginationResponseDto<Source>> {
    try {
      this.logger.info({ paginationRequest }, 'Getting all sources');

      const { page = 1, limit = 10 } = paginationRequest;

      const findOptions: FindManyOptions<Source> = {
        where: { deleted: false },
        skip: (+page - 1) * +limit,
        take: limit,
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
            filter.type === FilterType.STRING
              ? Like(`%${filterKeyValue.value}%`)
              : filterKeyValue.value;
        }
      });

      const [sources, totalCount] = await this.sourceRepository.findAndCount(
        findOptions
      );

      this.logger.info({ sources, totalCount }, 'All sources and count');

      return {
        current_page: +page,
        current_limit: +limit,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / +limit),
        data: sources,
      };
    } catch (err) {
      this.logger.error({ err }, 'Error while getting all sources');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get all sources');
    }
  }

  async findOne(sourceId: string) {
    try {
      this.logger.info({ sourceId }, 'Getting source');

      const source = await this.sourceRepository.findOne({
        where: { uuid: sourceId, deleted: false },
      });

      if (!source) {
        throw new NotFoundException('Source not found');
      }

      this.logger.info({ source }, 'Source found');

      return source;
    } catch (err) {
      this.logger.error({ err, sourceId }, 'Error while getting source');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get source');
    }
  }

  async findOneById(id: number) {
    try {
      return await this.sourceRepository.findOne({
        where: { id, deleted: false },
      });
    } catch (err) {
      this.logger.error({ err, id }, 'Error while getting source');
    }
  }

  async findByIds(
    sourceIds: string[],
    select: FindOptionsSelect<Source> = null
  ) {
    try {
      this.logger.info({ sourceIds }, 'Getting sources');

      const sources = await this.sourceRepository.find({
        select,
        where: { uuid: In(sourceIds), deleted: false },
      });

      if (!sources) {
        throw new NotFoundException('Sources not found');
      }

      this.logger.info({ sources }, 'Sources found');

      return sources;
    } catch (err) {
      this.logger.error({ err, sourceIds }, 'Error while getting sources');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get sources');
    }
  }

  async updateByUuid(
    sourceId: string,
    createSourceDto: CreateSourceDto,
    currentUserId: number
  ): Promise<Source> {
    try {
      this.logger.info({ sourceId, currentUserId }, 'Updating source');

      const source = await this.sourceRepository.findOne({
        where: { uuid: sourceId, deleted: false },
      });

      if (!source) {
        throw new NotFoundException('Source not found');
      }

      const newSource = await this.createSource(
        createSourceDto,
        currentUserId,
        true
      );

      this.logger.info(
        { newSource, currentUserId },
        'Source updated successfully'
      );

      return newSource;
    } catch (err) {
      this.logger.error(
        { err, sourceId, currentUserId },
        'Error while updating source'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to update source');
    }
  }

  async removeSource(sourceId: string, currentUserId: number): Promise<Source> {
    try {
      this.logger.info({ sourceId, currentUserId }, 'Deleting source');

      const source = await this.sourceRepository.findOne({
        where: { uuid: sourceId },
      });

      if (!source) {
        throw new NotFoundException('Source not found');
      }

      this.logger.info({ source }, 'Source found');

      const deletedSource = await this.sourceRepository.save({
        ...source,
        deleted: true,
        updatedByUid: currentUserId,
      });

      this.logger.info({ deletedSource }, 'Source deleted');

      return deletedSource;
    } catch (err) {
      this.logger.error({ err, sourceId }, 'Error while deleting source');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to delete source');
    }
  }

  getAvailableFilters(): Filter[] {
    const availableFilters = [
      {
        key: 'source_type',
        label: 'Source Type',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'name',
        label: 'Source Name',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'cloud_type',
        label: 'Cloud Type',
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
        key: 'sort_by',
        label: 'Sort By',
        type: FilterType.STRING,
        searchable: false,
      },
      {
        key: 'order_by',
        label: 'Order By',
        type: FilterType.STRING,
        searchable: false,
      },
    ];

    return availableFilters;
  }

  getFilterByFilterKey(filterKey: string): Filter {
    return this.getAvailableFilters().find(
      (filter) => filter.key === filterKey
    );
  }

  getColumnByFilterKey(filterKey: string): keyof Source {
    let column: keyof Source;
    switch (filterKey) {
      case 'source_type':
        column = 'type';
        break;
      case 'name':
        column = 'name';
        break;
      case 'cloud_type':
        column = 'cloudType';
        break;
      case 'active':
        column = 'active';
        break;
      case 'deleted':
        column = 'deleted';
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
        'Getting source filter values'
      );

      switch (filterKey) {
        case 'sort_by':
          return {
            values: [
              'sourceType',
              'cloudType',
              'name',
              'active',
              'createdAt',
              'updatedAt',
            ],
            total_count: 6,
          };
        case 'order_by':
          return {
            values: ['ASC', 'DESC'],
            total_count: 2,
          };
      }

      const column = this.getColumnByFilterKey(filterKey);
      const findOptions: FindManyOptions<Source> = {
        select: [column],
        where: { deleted: false },
        take: limit,
        skip: (page - 1) * limit,
      };

      const filter = this.getFilterByFilterKey(filterKey);
      if (filter.searchable && search) {
        findOptions.where[column] = Like(`%${search}%`);
      }

      const values = await this.sourceRepository.find(findOptions);
      const uniqueValues = [...new Set(values.map((value) => value[column]))];

      return {
        values: uniqueValues,
        total_count: uniqueValues.length,
      };
    } catch (err) {
      this.logger.error(
        { err, filterSearchQueryDto, filterKey },
        'Error getting filter values'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to get filter values');
    }
  }
}
