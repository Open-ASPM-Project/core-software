import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Put,
} from '@nestjs/common';
import { AssetGroupsService } from './asset-groups.service';
import {
  AssetIdsDto,
  CreateAssetGroupDto,
  GroupIdParamsDto,
  UpdateGroupDto,
} from './dto/asset-groups.dto';
import { AuthGuard, RolesGuard } from '@firewall-backend/guards';
import {
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@firewall-backend/enums';
import { Roles } from '@firewall-backend/decorators';
import { Request } from 'express';
import {
  ApplyFiltersDto,
  AssetIdParamsDto,
  FilterKeyParamsDto,
  FilterSearchQueryDto,
  PaginationRequestDto,
} from '@firewall-backend/dto';

@ApiBearerAuth()
@ApiTags('Asset Groups')
@Controller('asset-groups')
@UseGuards(AuthGuard)
export class AssetGroupsController {
  constructor(private readonly assetGroupsService: AssetGroupsService) {}

  /**
   * Create a new group
   */
  @Post()
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({
    status: 201,
    description: 'The group has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  createGroup(
    @Body() createGroupDto: CreateAssetGroupDto,
    @Req() req: Request
  ) {
    return this.assetGroupsService.create(createGroupDto, req.user.user_id);
  }

  /**
   * Get all groups with pagination and filtering
   */
  @Post('search')
  @ApiOperation({ summary: 'Get all groups with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all groups that match the filter criteria.',
  })
  async getAllGroups(
    @Query() query: PaginationRequestDto,
    @Body() body: ApplyFiltersDto
  ) {
    return this.assetGroupsService.findAll(query, body.filters);
  }

  /**
   * Get available filters for groups
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filters for groups' })
  @ApiResponse({
    status: 200,
    description: 'Returns the available filter options for groups.',
  })
  getGroupFilters() {
    return this.assetGroupsService.getAvailableFilters();
  }

  /**
   * Get filter values for a specific filter
   */
  @Get('filters/:filter_key/values')
  @ApiOperation({ summary: 'Get values for a specific filter' })
  @ApiParam({
    name: 'filter_key',
    description: 'The name of the filter to get values for',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter values',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the possible values for the specified filter.',
  })
  getGroupFilterValues(
    @Param() params: FilterKeyParamsDto,
    @Query() query: FilterSearchQueryDto
  ) {
    return this.assetGroupsService.getFilterValues(params.filter_key, query);
  }

  /**
   * Get a single group by ID
   */
  @Get(':group_id')
  @ApiOperation({ summary: 'Get a single group by ID' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the group with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async getGroupById(@Param() params: GroupIdParamsDto) {
    return this.assetGroupsService.findOne(params.group_id);
  }

  /**
   * Update a group
   */
  @Put(':group_id')
  @ApiOperation({ summary: 'Update a group' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'The group has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  updateGroup(
    @Param() params: GroupIdParamsDto,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: Request
  ) {
    return this.assetGroupsService.update(
      params.group_id,
      updateGroupDto,
      req.user.user_id
    );
  }

  /**
   * Delete a group
   */
  @Delete(':group_id')
  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'The group has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  deleteGroup(@Param() params: GroupIdParamsDto, @Req() req: Request) {
    return this.assetGroupsService.remove(params.group_id, req.user.user_id);
  }

  /**
   * Add an asset to a group
   */
  @Post(':group_id/assets')
  @ApiOperation({ summary: 'Add assets to a group' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'The assets have been successfully added to the group.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  addAssetsToGroup(
    @Param() params: GroupIdParamsDto,
    @Body() body: AssetIdsDto,
    @Req() req: Request
  ) {
    return this.assetGroupsService.addAssetsToGroup(
      params.group_id,
      body.assetIds,
      req.user.user_id
    );
  }

  /**
   * Remove assets from a group
   */
  @Delete(':group_id/assets')
  @ApiOperation({ summary: 'Remove assets from a group' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'The assets have been successfully removed from the group.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  removeAssetsFromGroup(
    @Param() params: GroupIdParamsDto,
    @Body() body: AssetIdsDto
  ) {
    return this.assetGroupsService.removeAssetsFromGroup(
      params.group_id,
      body.assetIds
    );
  }

  /**
   * Get all assets in a group
   */
  @Get(':group_id/assets')
  @ApiOperation({ summary: 'Get all assets in a group' })
  @ApiParam({ name: 'group_id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all assets in the specified group.',
  })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async getGroupAssets(@Param() params: GroupIdParamsDto) {
    return this.assetGroupsService.getGroupAssets(params.group_id);
  }

  /**
   * Get all groups that include a specific asset
   */
  @Get('assets/:asset_id/groups')
  @ApiOperation({ summary: 'Get all groups that include a specific asset' })
  @ApiParam({ name: 'asset_id', description: 'Asset UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all groups that include the specified asset.',
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  async getGroupsByAsset(@Param() params: AssetIdParamsDto) {
    return this.assetGroupsService.findGroupsByAssetId(params.asset_id);
  }
}
