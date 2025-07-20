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

import { AuthGuard, RolesGuard } from '@firewall-backend/guards';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@firewall-backend/enums';
import { Roles } from '@firewall-backend/decorators';
import { Request } from 'express';
import {
  ApplyFiltersDto,
  AssetIdParamsDto,
  AssetTypeQueryDto,
  CreateAssetDto,
  FilterKeyParamsDto,
  FilterSearchQueryDto,
  PaginationRequestDto,
  UpdateAssetDto,
} from '@firewall-backend/dto';
import { AssetsService } from './assets.service';

@ApiBearerAuth()
@ApiTags('Assets')
@Controller('assets')
@UseGuards(AuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Create a new asset
   */
  @Post()
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  createAsset(@Body() createAssetDto: CreateAssetDto, @Req() req: Request) {
    return this.assetsService.createAsset(createAssetDto, req.user.user_id);
  }

  /**
   * Bulk create assets
   */
  @Post('bulk')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Bulk create assets' })
  @ApiResponse({
    status: 201,
    description: 'The assets have been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    type: [CreateAssetDto],
    description: 'Array of assets to create',
  })
  bulkCreateAsset(
    @Body() createAssetDtos: CreateAssetDto[],
    @Req() req: Request
  ) {
    return this.assetsService.bulkCreate(
      createAssetDtos,
      null,
      req.user.user_id
    );
  }

  /**
   * Get all assets with pagination and filtering
   */
  @Post('search')
  @ApiOperation({ summary: 'Get all assets with pagination and filtering' })
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
    description: 'Returns all assets that match the filter criteria.',
  })
  async getAllAssets(
    @Query() query: PaginationRequestDto,
    @Body() body: ApplyFiltersDto
  ) {
    return this.assetsService.findAll(query, body.filters);
  }

  /**
   * Get available filters for assets
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filters for assets' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by asset type',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the available filter options for assets.',
  })
  getAssetFilters(@Query() query: AssetTypeQueryDto) {
    return this.assetsService.getAvailableFilters(query.type);
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
  getAssetFilterValues(
    @Param() params: FilterKeyParamsDto,
    @Query() query: FilterSearchQueryDto
  ) {
    return this.assetsService.getFilterValues(params.filter_key, query);
  }

  /**
   * Get a single asset by ID
   */
  @Get(':asset_id')
  @ApiOperation({ summary: 'Get a single asset by ID' })
  @ApiParam({ name: 'asset_id', description: 'Asset UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the asset with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  async getAssetById(@Param() params: AssetIdParamsDto) {
    return this.assetsService.findOneByUuid(params.asset_id);
  }

  /**
   * Update an asset
   */
  @Put(':asset_id')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update an asset' })
  @ApiParam({ name: 'asset_id', description: 'Asset UUID' })
  @ApiResponse({
    status: 200,
    description: 'The asset has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  updateAsset(
    @Param() params: AssetIdParamsDto,
    @Body() updateAssetDto: UpdateAssetDto,
    @Req() req: Request
  ) {
    return this.assetsService.updateAsset(
      params.asset_id,
      updateAssetDto,
      req.user.user_id
    );
  }

  /**
   * Delete an asset
   */
  @Delete(':asset_id')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiParam({ name: 'asset_id', description: 'Asset UUID' })
  @ApiResponse({
    status: 200,
    description: 'The asset has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  deleteAsset(@Param() params: AssetIdParamsDto, @Req() req: Request) {
    return this.assetsService.remove(params.asset_id, req.user.user_id);
  }
}
