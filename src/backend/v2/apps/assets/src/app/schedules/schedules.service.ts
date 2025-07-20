import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  CreateScheduleDto,
  CreateScheduleRunDto,
  UpdateScheduleDto,
} from './dto/schedules.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  PaginationRequestDto,
  PaginationResponseDto,
  FilterKeyValue,
  FilterSearchQueryDto,
} from '@firewall-backend/dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  FilterType,
  ScanTriggerType,
  ScheduleType,
  VulnerabilityProfiles,
} from '@firewall-backend/enums';
import { Filter, FilterValueCount } from '@firewall-backend/types';
import { Schedule, Asset, Source } from '@firewall-backend/entities';
import { ScheduleRunService } from './schedule-run.service';

@Injectable()
export class SchedulesService implements OnModuleInit {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly scheduleRunService: ScheduleRunService,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectPinoLogger(SchedulesService.name)
    private readonly logger: PinoLogger
  ) {}

  /**
   * Initialize all schedules when the module starts
   * This ensures persistence across pod restarts
   */
  async onModuleInit() {
    try {
      this.logger.info('Initializing schedules on application startup');

      // Find all active schedules
      const activeSchedules = await this.scheduleRepository.find({
        where: {
          active: true,
          deleted: false,
        },
        relations: ['assets', 'sources'],
      });

      this.logger.info(
        { schedulesCount: activeSchedules.length },
        'Found active schedules to initialize'
      );

      // Register each active schedule
      for (const schedule of activeSchedules) {
        try {
          // Skip registration if interval already exists (in case of hot reload)
          const existingIntervals = this.schedulerRegistry.getIntervals();
          if (existingIntervals.includes(schedule.uuid)) {
            this.logger.info(
              { scheduleId: schedule.uuid, scheduleName: schedule.name },
              'Schedule already registered, skipping'
            );
            continue;
          }

          // Register the schedule
          this.addInterval(schedule.uuid, schedule.interval * 1000, {
            type: schedule.type,
            vulnerabilityProfiles: schedule.vulnerabilityProfiles,
            assets: schedule.assets,
            sources: schedule.sources,
            scheduleId: schedule.id,
            triggerType: ScanTriggerType.SCHEDULED_SCAN,
          });

          this.logger.info(
            { scheduleId: schedule.uuid, scheduleName: schedule.name },
            'Schedule registered successfully on startup'
          );
        } catch (err) {
          this.logger.error(
            { err, scheduleId: schedule.uuid, scheduleName: schedule.name },
            'Failed to register schedule on startup'
          );
        }
      }

      this.logger.info('Completed initializing schedules');
    } catch (err) {
      this.logger.error(
        { err },
        'Error initializing schedules on application startup'
      );
    }
  }

  private addInterval(
    name: string,
    milliseconds: number,
    createScheduleRunDto: CreateScheduleRunDto
  ) {
    try {
      // Clear existing interval if it exists (to prevent duplicates)
      try {
        const existingIntervals = this.schedulerRegistry.getIntervals();
        if (existingIntervals.includes(name)) {
          this.schedulerRegistry.deleteInterval(name);
          this.logger.info(
            { scheduleName: name },
            'Removed existing interval before adding new one'
          );
        }
      } catch (err) {
        // Interval doesn't exist, which is fine
        this.logger.warn(
          { scheduleName: name, err },
          'No existing interval found to remove'
        );
      }

      const callback = async () => {
        try {
          this.logger.info({ scheduleName: name }, 'Running schedule');

          const scheduleRun = await this.scheduleRunService.createScheduleRun(
            createScheduleRunDto
          );

          this.logger.info(
            { scheduleRunId: scheduleRun.id },
            'Schedule run created successfully'
          );
        } catch (err) {
          this.logger.error(
            { err, scheduleName: name },
            'Error running scheduled scan'
          );
        }
      };

      const interval = setInterval(callback, milliseconds);
      this.schedulerRegistry.addInterval(name, interval);

      this.logger.info(
        { scheduleName: name, intervalMs: milliseconds },
        'Interval registered successfully'
      );
    } catch (err) {
      this.logger.error(
        { err, scheduleName: name, intervalMs: milliseconds },
        'Error registering interval'
      );
      throw err;
    }
  }

  async createVulnerabilityScanSchedule(
    createScheduleDto: CreateScheduleDto,
    currentUserId?: number
  ): Promise<Schedule> {
    try {
      this.logger.info(
        { createScheduleDto },
        'Creating vulnerability scan schedule'
      );

      const { active, name, interval, vulnerabilityProfiles, assetIds } =
        createScheduleDto;

      const schedule = await this.scheduleRepository.findOneBy({
        name,
        deleted: false,
      });
      if (schedule) {
        throw new BadRequestException('Schedule with this name already exists');
      }

      const assets = await this.assetRepository.find({
        select: { id: true },
        where: {
          uuid: In(assetIds),
          deleted: false,
        },
      });

      const newSchedule = await this.scheduleRepository.save({
        type: ScheduleType.VULNERABILITY_SCAN,
        active,
        interval,
        name,
        vulnerabilityProfiles: vulnerabilityProfiles,
        assets,
        addedByUid: currentUserId,
      });

      this.addInterval(newSchedule.uuid, newSchedule.interval * 1000, {
        type: ScheduleType.VULNERABILITY_SCAN,
        vulnerabilityProfiles,
        assets,
        scheduleId: newSchedule.id,
        triggerType: ScanTriggerType.SCHEDULED_SCAN,
      });

      this.logger.info(
        { newSchedule, vulnerabilityProfiles, assetIds },
        'Vulnerability scan schedule created'
      );

      return newSchedule;
    } catch (err) {
      this.logger.error(
        { err, createScheduleDto },
        'Error creating vulnerability scan schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while creating vulnerability scan schedule');
    }
  }

  async createAssetScanSchedule(
    createScheduleDto: CreateScheduleDto,
    currentUserId?: number
  ): Promise<Schedule> {
    try {
      this.logger.info({ createScheduleDto }, 'Creating asset scan schedule');

      const { active, name, interval, sourceIds } = createScheduleDto;

      const schedule = await this.scheduleRepository.findOneBy({
        name,
        deleted: false,
      });
      if (schedule) {
        throw new Error('Schedule with this name already exists');
      }

      const sources = await this.sourceRepository.find({
        select: { id: true },
        where: {
          uuid: In(sourceIds),
          deleted: false,
        },
      });

      const newSchedule = await this.scheduleRepository.save({
        type: ScheduleType.ASSET_SCAN,
        active,
        interval,
        name,
        sources,
        addedByUid: currentUserId,
      });

      this.addInterval(newSchedule.uuid, newSchedule.interval * 1000, {
        type: ScheduleType.ASSET_SCAN,
        sources,
        scheduleId: newSchedule.id,
        triggerType: ScanTriggerType.SCHEDULED_SCAN,
      });

      this.logger.info(
        { newSchedule, sourceIds },
        'Asset scan schedule created'
      );

      return newSchedule;
    } catch (err) {
      this.logger.error(
        { err, createScheduleDto },
        'Error creating asset scan schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while creating asset scan schedule');
    }
  }

  async createWebappScanSchedule(
    createScheduleDto: CreateScheduleDto,
    currentUserId?: number
  ): Promise<Schedule> {
    try {
      this.logger.info(
        { createScheduleDto },
        'Creating webapp asset scan schedule'
      );

      const { active, name, interval, assetIds } = createScheduleDto;

      const schedule = await this.scheduleRepository.findOneBy({
        name,
        deleted: false,
      });
      if (schedule) {
        throw new BadRequestException('Schedule with this name already exists');
      }

      const assets = await this.assetRepository.find({
        select: { id: true },
        where: {
          uuid: In(assetIds),
          deleted: false,
        },
      });

      const newSchedule = await this.scheduleRepository.save({
        type: ScheduleType.WEBAPP_ASSET_SCAN,
        active,
        interval,
        name,
        assets,
        addedByUid: currentUserId,
      });

      this.addInterval(newSchedule.uuid, newSchedule.interval * 1000, {
        type: ScheduleType.WEBAPP_ASSET_SCAN,
        assets,
        scheduleId: newSchedule.id,
        triggerType: ScanTriggerType.SCHEDULED_SCAN,
      });

      this.logger.info(
        { newSchedule, assetIds },
        'Webapp asset scan schedule created'
      );

      return newSchedule;
    } catch (err) {
      this.logger.error(
        { err, createScheduleDto },
        'Error creating webapp asset scan schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while creating webapp asset scan schedule');
    }
  }

  async createSchedule(
    createScheduleDto: CreateScheduleDto,
    currentUserId: number
  ): Promise<Schedule> {
    try {
      this.logger.info(
        { createScheduleDto, currentUserId },
        'Creating schedule'
      );

      const { type } = createScheduleDto;

      switch (type) {
        case ScheduleType.VULNERABILITY_SCAN: {
          createScheduleDto.vulnerabilityProfiles =
            createScheduleDto.vulnerabilityProfiles ??
            Object.values(VulnerabilityProfiles);
          createScheduleDto.assetIds = createScheduleDto.assetIds ?? [];
          return await this.createVulnerabilityScanSchedule(
            createScheduleDto,
            currentUserId
          );
        }
        case ScheduleType.ASSET_SCAN: {
          createScheduleDto.sourceIds = createScheduleDto.sourceIds ?? [];
          return await this.createAssetScanSchedule(
            createScheduleDto,
            currentUserId
          );
        }
        case ScheduleType.WEBAPP_ASSET_SCAN: {
          createScheduleDto.assetIds = createScheduleDto.assetIds ?? [];
          return await this.createWebappScanSchedule(
            createScheduleDto,
            currentUserId
          );
        }
        default: {
          this.logger.error({ createScheduleDto }, 'Invalid schedule type');

          throw new BadRequestException('Invalid schedule type');
        }
      }
    } catch (err) {
      this.logger.error(
        { err, createScheduleDto, currentUserId },
        'Error while creating schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while creating schedule');
    }
  }

  async addAssetsToSchedule(
    scheduleId: string,
    assetIds: string[],
    currentUserId: number = null
  ): Promise<Schedule> {
    try {
      this.logger.info(
        { scheduleId, assetIds, currentUserId },
        'Adding assets to schedule'
      );

      let schedule = await this.scheduleRepository.findOne({
        where: {
          uuid: scheduleId,
          deleted: false,
        },
        relations: ['assets'],
      });
      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }
      if (schedule.type !== ScheduleType.VULNERABILITY_SCAN) {
        throw new BadRequestException('Invalid schedule type');
      }

      const assets = await this.assetRepository.find({
        select: { id: true },
        where: {
          uuid: In(assetIds),
          deleted: false,
        },
      });

      schedule.assets = [...schedule.assets, ...assets];

      schedule = await this.scheduleRepository.save({
        ...schedule,
        updatedByUid: currentUserId,
      });

      return schedule;
    } catch (err) {
      this.logger.error(
        { err, scheduleId, assetIds, currentUserId },
        'Error adding assets to schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error adding assets to schedule');
    }
  }

  async addSourcesToSchedule(
    scheduleId: string,
    sourceIds: string[],
    currentUserId: number = null
  ): Promise<Schedule> {
    try {
      this.logger.info(
        { scheduleId, sourceIds, currentUserId },
        'Adding sources to schedule'
      );

      let schedule = await this.scheduleRepository.findOne({
        where: {
          uuid: scheduleId,
          deleted: false,
        },
        relations: ['sources'],
      });
      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }
      if (schedule.type !== ScheduleType.ASSET_SCAN) {
        throw new BadRequestException('Invalid schedule type');
      }

      const sources = await this.sourceRepository.find({
        select: { id: true },
        where: {
          uuid: In(sourceIds),
          deleted: false,
        },
      });

      schedule.sources = [...schedule.sources, ...sources];

      schedule = await this.scheduleRepository.save({
        ...schedule,
        updatedByUid: currentUserId,
      });

      return schedule;
    } catch (err) {
      this.logger.error(
        { err, scheduleId, sourceIds, currentUserId },
        'Error adding sources to schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error adding sources to schedule');
    }
  }

  async findAll(
    paginationRequestDto: PaginationRequestDto,
    filters: FilterKeyValue[] = []
  ): Promise<PaginationResponseDto<Schedule>> {
    try {
      this.logger.info(
        { paginationRequestDto, filters },
        'Finding schedules with filters'
      );

      // Start building the query
      const query = this.scheduleRepository.createQueryBuilder('schedule');

      // Always filter out deleted schedules by default
      query.where('schedule.deleted = :deleted', { deleted: false });

      // Apply custom filters
      this.applyFilters(query, filters);

      // Get total count before pagination
      const total = await query.getCount();

      // Apply pagination
      const { page = 1, limit = 10 } = paginationRequestDto;
      const skip = (page - 1) * limit;

      query.skip(skip).take(limit);

      // Apply sorting
      const sortBy = this.getSortByFromFilters(filters) || 'createdAt';
      const orderBy = this.getOrderByFromFilters(filters) || 'DESC';
      query.orderBy(`schedule.${sortBy}`, orderBy);

      // Execute query
      const schedules = await query.getMany();

      this.logger.info(
        { count: schedules.length, total, page, limit },
        'Schedules found with pagination'
      );

      return {
        data: schedules,
        total_count: total,
        current_limit: limit,
        current_page: page,
        total_pages: Math.ceil(total / limit),
      };
    } catch (err) {
      this.logger.error(
        { err, paginationRequestDto, filters },
        'Error finding schedules with filters'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while fetching schedules');
    }
  }

  private applyFilters(
    query: SelectQueryBuilder<Schedule>,
    filters: FilterKeyValue[]
  ): void {
    if (!filters || filters.length === 0) {
      return;
    }

    filters.forEach((filter) => {
      const { filter_key: key, value } = filter;

      if (!key || value === undefined || value === null) {
        return;
      }

      // Skip sort and order filters as they're handled separately
      if (key === 'sort_by' || key === 'order_by') {
        return;
      }

      // Special handling for asset_id filter - find schedules with the given asset
      if (key === 'asset_id') {
        query
          .innerJoin('schedule.assets', 'asset')
          .andWhere('asset.uuid = :assetUuid', { assetUuid: value });
        return;
      }

      const filterDef = this.getFilterByFilterKey(key);
      if (!filterDef) {
        return;
      }

      // Handle different filter types
      switch (filterDef.type) {
        case FilterType.STRING:
          if (filterDef.searchable) {
            query.andWhere(`schedule.${key} ILIKE :${key}`, {
              [key]: `%${value}%`,
            });
          } else {
            query.andWhere(`schedule.${key} = :${key}`, { [key]: value });
          }
          break;

        case FilterType.INTEGER:
          query.andWhere(`schedule.${key} = :${key}`, { [key]: value });
          break;

        case FilterType.BOOLEAN:
          query.andWhere(`schedule.${key} = :${key}`, {
            [key]: value === 'true',
          });
          break;

        case FilterType.DATE:
          // Handle date range if value is an array with two elements
          if (Array.isArray(value) && value.length === 2) {
            const [startDate, endDate] = value;
            if (startDate) {
              query.andWhere(`schedule.${key} >= :${key}Start`, {
                [`${key}Start`]: startDate,
              });
            }
            if (endDate) {
              query.andWhere(`schedule.${key} <= :${key}End`, {
                [`${key}End`]: endDate,
              });
            }
          }
          break;
      }
    });
  }

  private getSortByFromFilters(filters: FilterKeyValue[]): string | null {
    const sortByFilter = filters.find(
      (filter) => filter.filter_key === 'sort_by'
    );
    if (sortByFilter?.value) {
      const column = this.getColumnByFilterKey(sortByFilter.value);
      return column || null;
    }
    return null;
  }

  private getOrderByFromFilters(
    filters: FilterKeyValue[]
  ): 'ASC' | 'DESC' | null {
    const orderByFilter = filters.find(
      (filter) => filter.filter_key === 'order_by'
    );
    if (orderByFilter?.value) {
      const value = orderByFilter.value.toUpperCase();
      return value === 'ASC' ? 'ASC' : 'DESC';
    }
    return null;
  }

  async findOne(scheduleId: string): Promise<Schedule> {
    try {
      this.logger.info({ scheduleId }, 'Fetching schedule');

      const schedule = await this.scheduleRepository.findOneBy({
        uuid: scheduleId,
        deleted: false,
      });

      if (!schedule) {
        this.logger.warn({ scheduleId }, 'Schedule not found');
        throw new NotFoundException('Schedule not found');
      }

      return schedule;
    } catch (err) {
      this.logger.error({ err, scheduleId }, 'Error while fetching schedule');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while fetching schedule');
    }
  }

  // Helper method to update interval when schedule changes
  private async updateInterval(schedule: Schedule) {
    try {
      this.logger.info(
        {
          scheduleId: schedule.uuid,
          interval: schedule.interval,
          active: schedule.active,
        },
        'Updating schedule interval'
      );

      // If schedule is active, update the interval
      if (schedule.active) {
        this.addInterval(schedule.uuid, schedule.interval * 1000, {
          type: schedule.type,
          vulnerabilityProfiles: schedule.vulnerabilityProfiles,
          assets: schedule.assets,
          sources: schedule.sources,
          scheduleId: schedule.id,
          triggerType: ScanTriggerType.SCHEDULED_SCAN,
        });
      } else {
        // If schedule is inactive, remove the interval
        try {
          this.schedulerRegistry.deleteInterval(schedule.uuid);
          this.logger.info(
            { scheduleId: schedule.uuid },
            'Removed interval for inactive schedule'
          );
        } catch (err) {
          // Interval might not exist, which is fine
          this.logger.warn(
            { scheduleId: schedule.uuid, err },
            'No interval found to remove'
          );
        }
      }
    } catch (err) {
      this.logger.error(
        { err, scheduleId: schedule.uuid },
        'Error updating schedule interval'
      );
    }
  }

  async updateSchedule(
    scheduleId: string,
    updateScheduleDto: UpdateScheduleDto,
    currentUserId: number
  ): Promise<Schedule> {
    try {
      this.logger.info({ scheduleId, updateScheduleDto }, 'Updating schedule');

      const schedule = await this.scheduleRepository.findOne({
        where: {
          uuid: scheduleId,
          deleted: false,
        },
        relations: ['assets', 'sources'],
      });

      if (!schedule) {
        this.logger.warn({ scheduleId }, 'Schedule not found');
        throw new NotFoundException('Schedule not found');
      }

      const updates: Partial<Schedule> = {};
      if ([true, false].includes(updateScheduleDto.active)) {
        updates.active = updateScheduleDto.active;
      }
      if (updateScheduleDto.interval) {
        updates.interval = updateScheduleDto.interval;
      }

      switch (schedule.type) {
        case ScheduleType.VULNERABILITY_SCAN: {
          if (updateScheduleDto.vulnerabilityProfiles?.length) {
            updates.vulnerabilityProfiles =
              updateScheduleDto.vulnerabilityProfiles;
          }

          if (updateScheduleDto.assetIds?.length) {
            const assets = await this.assetRepository.find({
              select: { id: true },
              where: {
                uuid: In(updateScheduleDto.assetIds),
                deleted: false,
              },
            });
            updates.assets = assets;
          }
          break;
        }
        case ScheduleType.ASSET_SCAN: {
          if (updateScheduleDto.sourceIds?.length) {
            const sources = await this.sourceRepository.find({
              select: { id: true },
              where: {
                uuid: In(updateScheduleDto.sourceIds),
                deleted: false,
              },
            });
            updates.sources = sources;
          }
          break;
        }
        default: {
          this.logger.error({ type: schedule.type }, 'Invalid schedule type');
          throw new BadRequestException('Invalid schedule type');
        }
      }

      // Update the schedule
      const updatedSchedule = await this.scheduleRepository.save({
        ...schedule,
        ...updates,
        updatedByUid: currentUserId,
      });

      // Update the interval if interval or active status has changed
      if (
        updateScheduleDto.interval !== undefined ||
        updateScheduleDto.active !== undefined
      ) {
        await this.updateInterval(updatedSchedule);
      }

      this.logger.info(
        { scheduleId, updatedSchedule },
        'Schedule updated successfully'
      );

      return updatedSchedule;
    } catch (err) {
      this.logger.error(
        { err, scheduleId, updateScheduleDto },
        'Error while updating schedule'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while updating schedule');
    }
  }

  async removeSchedule(
    scheduleId: string,
    currentUserId: number
  ): Promise<Schedule> {
    try {
      this.logger.info({ scheduleId, currentUserId }, 'Deleting schedule');

      const schedule = await this.scheduleRepository.findOneBy({
        uuid: scheduleId,
        deleted: false,
      });

      if (!schedule) {
        this.logger.warn({ scheduleId }, 'Schedule not found');
        throw new NotFoundException('Schedule not found');
      }

      // Soft delete the schedule and ensure it's marked as inactive
      const deletedSchedule = await this.scheduleRepository.save({
        ...schedule,
        deleted: true,
        active: false,
        updatedByUid: currentUserId,
      });

      // Remove the interval
      try {
        this.schedulerRegistry.deleteInterval(scheduleId);
        this.logger.info(
          { scheduleId },
          'Removed interval for deleted schedule'
        );
      } catch (err) {
        // Interval might not exist, which is fine
        this.logger.warn(
          { scheduleId, err },
          'No interval found to remove for deleted schedule'
        );
      }

      this.logger.info(
        { scheduleId, currentUserId },
        'Schedule deleted successfully'
      );

      return deletedSchedule;
    } catch (err) {
      this.logger.error({ err, scheduleId }, 'Error while deleting schedule');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Error while deleting schedule');
    }
  }

  getAvailableFilters(): Filter[] {
    const availableFilters = [
      {
        key: 'name',
        label: 'Schedule Name',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'interval',
        label: 'Interval (seconds)',
        type: FilterType.INTEGER,
        searchable: false,
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
        key: 'asset_id',
        label: 'Asset ID',
        type: FilterType.STRING,
        searchable: false,
      },
      {
        key: 'createdAt',
        label: 'Created At',
        type: FilterType.DATE,
        searchable: false,
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        type: FilterType.DATE,
        searchable: false,
      },
      {
        key: 'addedByUid',
        label: 'Added By',
        type: FilterType.INTEGER,
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

  getColumnByFilterKey(filterKey: string): keyof Schedule | null {
    let column: keyof Schedule | null = null;
    switch (filterKey) {
      case 'name':
        column = 'name';
        break;
      case 'interval':
        column = 'interval';
        break;
      case 'active':
        column = 'active';
        break;
      case 'deleted':
        column = 'deleted';
        break;
      case 'vulnerability_profiles':
        column = 'vulnerabilityProfiles';
        break;
      case 'createdAt':
        column = 'createdAt';
        break;
      case 'updatedAt':
        column = 'updatedAt';
        break;
      case 'addedByUid':
        column = 'addedByUid';
        break;
    }
    return column;
  }

  async getFilterValues(
    filterKey: string,
    filterSearchQueryDto: FilterSearchQueryDto
  ): Promise<FilterValueCount> {
    try {
      const { page = 1, limit = 10, search } = filterSearchQueryDto;

      this.logger.info({ filterKey, limit, search }, 'Getting filter values');

      const filter = this.getFilterByFilterKey(filterKey);
      if (!filter) {
        throw new NotFoundException(`Filter with key ${filterKey} not found`);
      }

      // Special handling for asset_id filter
      if (filterKey === 'asset_id') {
        const query = this.scheduleRepository
          .createQueryBuilder('schedule')
          .innerJoin('schedule.assets', 'asset')
          .select('DISTINCT asset.uuid', 'value')
          .where('schedule.deleted = :deleted', { deleted: false })
          .orderBy('asset.uuid', 'ASC')
          .skip((page - 1) * limit)
          .take(limit);

        const results = await query.getRawMany();
        const values = results.map((result) => result.value);

        // Count total distinct values
        const countQuery = this.scheduleRepository
          .createQueryBuilder('schedule')
          .innerJoin('schedule.assets', 'asset')
          .select('COUNT(DISTINCT asset.uuid)', 'total')
          .where('schedule.deleted = :deleted', { deleted: false });

        const totalResult = await countQuery.getRawOne();
        const total_count = parseInt(totalResult.total, 10);

        return {
          values,
          total_count,
        };
      }

      // Get column name to use in query
      const column = this.getColumnByFilterKey(filterKey);
      if (!column) {
        throw new NotFoundException(`Invalid filter key: ${filterKey}`);
      }

      // Build query to get distinct values
      const query = this.scheduleRepository
        .createQueryBuilder('schedule')
        .select(`DISTINCT schedule.${column}`, 'value')
        .where('schedule.deleted = :deleted', { deleted: false })
        .andWhere(`schedule.${column} IS NOT NULL`);

      // Apply search filter if provided
      if (search && filter.type === FilterType.STRING && filter.searchable) {
        query.andWhere(`schedule.${column} ILIKE :search`, {
          search: `%${search}%`,
        });
      }

      query
        .orderBy(`schedule.${column}`, 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      const results = await query.getRawMany();
      const values = results.map((result) => result.value);

      // Count total distinct values
      const countQuery = this.scheduleRepository
        .createQueryBuilder('schedule')
        .select(`COUNT(DISTINCT schedule.${column})`, 'total')
        .where('schedule.deleted = :deleted', { deleted: false })
        .andWhere(`schedule.${column} IS NOT NULL`);

      if (search && filter.type === FilterType.STRING && filter.searchable) {
        countQuery.andWhere(`schedule.${column} ILIKE :search`, {
          search: `%${search}%`,
        });
      }

      const totalResult = await countQuery.getRawOne();
      const total_count = parseInt(totalResult.total, 10);

      this.logger.info(
        { filterKey, valuesCount: values.length, totalCount: total_count },
        'Filter values retrieved'
      );

      return {
        values,
        total_count,
      };
    } catch (err) {
      this.logger.error(
        { err, filterKey, filterSearchQueryDto },
        'Error getting filter values'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to get filter values for ${filterKey}`);
    }
  }
}
