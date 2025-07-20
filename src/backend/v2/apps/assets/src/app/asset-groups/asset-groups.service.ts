import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateAssetGroupDto, UpdateGroupDto } from './dto/asset-groups.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  PaginationRequestDto,
  FilterKeyValue,
  PaginationResponseDto,
  FilterSearchQueryDto,
} from '@firewall-backend/dto';
import { FilterType } from '@firewall-backend/enums';
import { Filter, FilterValueCount } from '@firewall-backend/types';
import { AssetToGroup, AssetGroup, Asset } from '@firewall-backend/entities';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class AssetGroupsService {
  constructor(
    private readonly assetsService: AssetsService,
    @InjectRepository(AssetGroup)
    private readonly assetGroupRepository: Repository<AssetGroup>,
    @InjectRepository(AssetToGroup)
    private readonly assetToGroupRepository: Repository<AssetToGroup>,
    @InjectPinoLogger(AssetGroupsService.name)
    private readonly logger: PinoLogger
  ) {}

  async create(createGroupDto: CreateAssetGroupDto, currentUserId: number) {
    try {
      this.logger.info({ createGroupDto, currentUserId }, 'Creating new group');

      // Check if group with the same name already exists
      const existingGroup = await this.assetGroupRepository.findOne({
        where: { name: createGroupDto.name, deleted: false },
      });
      if (existingGroup) {
        this.logger.error(
          { existingGroup },
          'AssetGroup with this name already exists'
        );
        throw new BadRequestException(
          `AssetGroup with name ${createGroupDto.name} already exists`
        );
      }

      const group = await this.assetGroupRepository.save({
        active: createGroupDto.active,
        description: createGroupDto.description,
        name: createGroupDto.name,
        addedByUid: currentUserId,
        updatedByUid: currentUserId,
      });

      const assets = (await this.assetsService.findByUuids(
        createGroupDto.assetIds,
        { id: true },
        {},
        false
      )) as Asset[];

      const promises = [];
      for (const asset of assets) {
        const assetToGroup = this.assetToGroupRepository.create({
          groupId: group.id,
          assetId: asset.id,
          addedByUid: currentUserId,
        });
        promises.push(this.assetToGroupRepository.save(assetToGroup));
      }

      const assetGroups = await Promise.all(promises);

      this.logger.info(
        { group, assetGroups, currentUserId },
        'AssetGroup created successfully'
      );

      return group;
    } catch (err) {
      this.logger.error(
        { err, createGroupDto, currentUserId },
        'Error creating group'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error('Failed to create group');
    }
  }

  async findAll(
    paginationRequestDto: PaginationRequestDto,
    filters: FilterKeyValue[] = []
  ): Promise<PaginationResponseDto<AssetGroup>> {
    try {
      this.logger.info(
        { paginationRequestDto, filters },
        'Finding all groups with filters'
      );

      // Start building the query
      const query = this.assetGroupRepository.createQueryBuilder('group');

      // Always filter out deleted groups
      query.where('group.deleted = :deleted', { deleted: false });

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
      query.orderBy(`group.${sortBy}`, orderBy);

      // Execute query
      const groups = await query.getMany();

      this.logger.info(
        { count: groups.length, total, page, limit },
        'Groups found with pagination'
      );

      return {
        data: groups,
        total_count: total,
        current_limit: limit,
        current_page: page,
        total_pages: Math.ceil(total / limit),
      };
    } catch (err) {
      this.logger.error(
        { err, paginationRequestDto, filters },
        'Error finding groups with filters'
      );

      throw new Error('Failed to find groups');
    }
  }

  private applyFilters(
    query: SelectQueryBuilder<AssetGroup>,
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

      // Special handling for asset_id filter
      if (key === 'asset_id') {
        query
          .innerJoin('group.assetGroups', 'ga')
          .andWhere('ga.assetId = :assetId', { assetId: value });
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
            query.andWhere(`group.${key} LIKE :${key}`, {
              [key]: `%${value}%`,
            });
          } else {
            query.andWhere(`group.${key} = :${key}`, { [key]: value });
          }
          break;

        case FilterType.INTEGER:
          query.andWhere(`group.${key} = :${key}`, { [key]: value });
          break;

        case FilterType.BOOLEAN:
          query.andWhere(`group.${key} = :${key}`, { [key]: value === 'true' });
          break;

        case FilterType.DATE:
          // Handle date range if value is an array with two elements
          if (Array.isArray(value) && value.length === 2) {
            const [startDate, endDate] = value;
            if (startDate) {
              query.andWhere(`group.${key} >= :${key}Start`, {
                [`${key}Start`]: startDate,
              });
            }
            if (endDate) {
              query.andWhere(`group.${key} <= :${key}End`, {
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

  /**
   * Find a group by its UUID
   * @param groupId The UUID of the group to find
   * @param includeDeleted Whether to include deleted groups in the search
   * @returns The found group entity
   */
  async findOne(groupId: string, includeDeleted = false) {
    try {
      this.logger.info({ groupId, includeDeleted }, 'Finding group by UUID');

      const query = this.assetGroupRepository
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.assetGroups', 'assetGroups')
        .leftJoinAndSelect('assetGroups.asset', 'asset')
        .where('group.uuid = :groupId', { groupId });

      if (!includeDeleted) {
        query.andWhere('group.deleted = :deleted', { deleted: false });
      }

      const group = await query.getOne();

      if (!group) {
        this.logger.error({ groupId }, 'AssetGroup not found');
        throw new NotFoundException(`AssetGroup not found`);
      }

      this.logger.info(
        { groupId, hasAssets: group.assetToGroups?.length > 0 },
        'AssetGroup found'
      );
      return group;
    } catch (err) {
      this.logger.error(
        { err, groupId, includeDeleted },
        'Error finding group'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to find group with UUID ${groupId}`);
    }
  }

  async update(
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    currentUserId: number
  ) {
    try {
      this.logger.info(
        { groupId, updateGroupDto, currentUserId },
        'Updating group'
      );

      const group = await this.findOne(groupId);

      // Update group properties
      Object.assign(group, {
        ...updateGroupDto,
        updatedByUid: currentUserId,
      });

      const updatedGroup = await this.assetGroupRepository.save(group);
      this.logger.info(
        { groupId, currentUserId },
        'AssetGroup updated successfully'
      );

      return updatedGroup;
    } catch (err) {
      this.logger.error(
        { err, groupId, updateGroupDto, currentUserId },
        'Error updating group'
      );

      throw new Error(`Failed to update group with UUID ${groupId}`);
    }
  }

  async remove(groupId: string, currentUserId: number) {
    try {
      this.logger.info({ groupId, currentUserId }, 'Soft deleting group');

      const group = await this.findOne(groupId);

      // Soft delete
      group.deleted = true;
      group.updatedByUid = currentUserId;

      const deletedGroup = await this.assetGroupRepository.save(group);
      this.logger.info(
        { groupId, currentUserId },
        'AssetGroup soft deleted successfully'
      );

      return deletedGroup;
    } catch (err) {
      this.logger.error(
        { err, groupId, currentUserId },
        'Error soft deleting group'
      );

      throw new Error(`Failed to delete group with UUID ${groupId}`);
    }
  }

  async addAssetsToGroup(
    groupId: string,
    assetIds: string[], // Changed from number to string since we're using UUID
    currentUserId: number
  ) {
    try {
      this.logger.info(
        { groupId, assetIds, currentUserId },
        'Adding asset to group'
      );

      // Verify group and asset exist
      const group = await this.findOne(groupId);
      if (!group) {
        this.logger.warn({ groupId }, 'AssetGroup not found');
        throw new NotFoundException(
          `AssetGroup with UUID ${groupId} not found`
        );
      }

      const assets = (await this.assetsService.findByUuids(
        assetIds,
        { id: true },
        null,
        false
      )) as Asset[];

      const promises = [];
      for (const asset of assets) {
        const assetToGroup = this.assetToGroupRepository.create({
          groupId: group.id,
          assetId: asset.id,
          addedByUid: currentUserId,
        });
        promises.push(this.assetToGroupRepository.save(assetToGroup));
      }

      const assetGroups = await Promise.all(promises);

      this.logger.info(
        { group, assetGroups, currentUserId },
        'Assets added to group successfully'
      );

      return assetGroups;
    } catch (err) {
      this.logger.error(
        { err, groupId, assetIds, currentUserId },
        'Error adding asset to group'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to add assets to group ${groupId}`);
    }
  }

  async removeAssetsFromGroup(groupId: string, assetIds: string[]) {
    try {
      this.logger.info({ groupId, assetIds }, 'Removing assets from group');

      const group = await this.findOne(groupId);
      if (!group) {
        this.logger.warn({ groupId }, 'AssetGroup not found');
        throw new NotFoundException(
          `AssetGroup with UUID ${groupId} not found`
        );
      }

      const assets = (await this.assetsService.findByUuids(
        assetIds,
        { id: true },
        null,
        false
      )) as Asset[];

      const assetIdsToRemove = assets.map((asset) => asset.id);

      const result = await this.assetToGroupRepository.delete({
        groupId: group.id,
        assetId: In(assetIdsToRemove),
      });

      this.logger.info(
        { assetIdsToRemove, group, result },
        'Assets removed from group successfully'
      );

      return result;
    } catch (err) {
      this.logger.error(
        { err, groupId, assetIds },
        'Error removing asset from group'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to remove assets from group ${groupId}`);
    }
  }

  async getGroupAssets(groupId: string) {
    try {
      this.logger.info({ groupId }, 'Getting assets for group');

      const group = await this.findOne(groupId);
      if (!group) {
        this.logger.warn({ groupId }, 'AssetGroup not found');
        throw new NotFoundException(
          `AssetGroup with UUID ${groupId} not found`
        );
      }

      const assetGroups = await this.assetToGroupRepository.find({
        where: { groupId: group.id },
        relations: ['asset'],
      });

      const assets = assetGroups.map((ga) => ga.asset);
      this.logger.info(
        { groupId, assetCount: assets.length },
        'Retrieved group assets successfully'
      );

      return assets;
    } catch (err) {
      this.logger.error({ err, groupId }, 'Error getting assets for group');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to get assets for group ${groupId}`);
    }
  }

  async findGroupsByAssetId(assetId: string): Promise<AssetGroup[]> {
    try {
      this.logger.info({ assetId }, 'Finding groups by asset UUID');

      // Find asset by UUID first
      const asset = (await this.assetsService.findOneByUuid(
        assetId,
        null,
        {},
        false
      )) as Asset;

      if (!asset) {
        this.logger.warn({ assetId }, 'Asset not found');
        throw new NotFoundException(`Asset not found`);
      }

      const query = this.assetGroupRepository
        .createQueryBuilder('group')
        .innerJoin('group.assetGroups', 'assetGroup')
        .where('assetGroup.assetId = :assetId', { assetId: asset.id })
        .andWhere('group.active = :active', { active: true })
        .andWhere('group.deleted = :deleted', { deleted: false });

      const groups = await query.getMany();

      this.logger.info(
        { assetId, groupCount: groups.length },
        'Groups found for asset'
      );

      return groups;
    } catch (err) {
      this.logger.error({ err, assetId }, 'Error finding groups by asset UUID');

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to find groups for asset ${assetId}`);
    }
  }

  getAvailableFilters(): Filter[] {
    const availableFilters = [
      {
        key: 'name',
        label: 'AssetGroup Name',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'description',
        label: 'Description',
        type: FilterType.STRING,
        searchable: true,
      },
      {
        key: 'asset_id',
        label: 'Asset ID',
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

  getColumnByFilterKey(filterKey: string): keyof AssetGroup | null {
    let column: keyof AssetGroup | null = null;
    switch (filterKey) {
      case 'name':
        column = 'name';
        break;
      case 'description':
        column = 'description';
        break;
      case 'active':
        column = 'active';
        break;
      case 'deleted':
        column = 'deleted';
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
        const query = this.assetGroupRepository
          .createQueryBuilder('group')
          .innerJoin('group.assetGroups', 'ga')
          .innerJoin('ga.asset', 'asset')
          .andWhere('ga.assetId IS NOT NULL')
          .select('DISTINCT asset.uuid', 'value')
          .skip((page - 1) * limit)
          .take(limit);

        const results = await query.getRawMany();
        const values = results.map((result) => result.value);

        // Count total distinct values
        const countQuery = this.assetGroupRepository
          .createQueryBuilder('group')
          .innerJoin('group.assetGroups', 'ga')
          .innerJoin('ga.asset', 'asset')
          .select('COUNT(DISTINCT asset.uuid)', 'total')
          .andWhere('ga.assetId IS NOT NULL');

        const totalResult = await countQuery.getRawOne();
        const total_count = parseInt(totalResult.total, 10);

        return { values, total_count };
      }

      // Get column name to use in query
      const column = this.getColumnByFilterKey(filterKey);
      if (!column) {
        throw new NotFoundException(`Invalid filter key: ${filterKey}`);
      }

      // Build query to get distinct values
      const query = this.assetGroupRepository
        .createQueryBuilder('group')
        .select(`DISTINCT group.${column}`, 'value')
        .where('group.deleted = :deleted', { deleted: false })
        .andWhere(`group.${column} IS NOT NULL`);

      // Apply search filter if provided
      if (search && filter.type === FilterType.STRING && filter.searchable) {
        query.andWhere(`group.${column} LIKE :search`, {
          search: `%${search}%`,
        });
      }

      query.skip((page - 1) * limit).take(limit);
      const results = await query.getRawMany();
      const values = results.map((result) => result.value);

      // Count total distinct values
      const countQuery = this.assetGroupRepository
        .createQueryBuilder('group')
        .select(`COUNT(DISTINCT group.${column})`, 'total')
        .where('group.deleted = :deleted', { deleted: false })
        .andWhere(`group.${column} IS NOT NULL`);

      if (search && filter.type === FilterType.STRING && filter.searchable) {
        countQuery.andWhere(`group.${column} LIKE :search`, {
          search: `%${search}%`,
        });
      }

      const totalResult = await countQuery.getRawOne();
      const total_count = parseInt(totalResult.total, 10);

      this.logger.info(
        { filterKey, valuesCount: values.length, totalCount: total_count },
        'Filter values retrieved'
      );

      return { values, total_count };
    } catch (err) {
      this.logger.error(
        { err, filterSearchQueryDto, filterKey },
        'Error getting filter values'
      );

      if (err?.response?.statusCode) {
        throw err;
      }

      throw new Error(`Failed to get filter values for ${filterKey}`);
    }
  }
}
