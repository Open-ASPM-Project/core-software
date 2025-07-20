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
} from '@nestjs/swagger';
import { CloudType, UserRole } from '@firewall-backend/enums';
import { Roles } from '@firewall-backend/decorators';
import { Request } from 'express';
import {
  ApplyFiltersDto,
  FilterKeyParamsDto,
  FilterSearchQueryDto,
  PaginationRequestDto,
} from '@firewall-backend/dto';
import { SourcesService } from './sources.service';
import { CreateSourceDto, SourceIdParamsDto } from './dto/sources.dto';

@ApiBearerAuth()
@ApiTags('Sources')
@Controller('sources')
@UseGuards(AuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  /**
   * Create a new source
   */
  @Post()
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new source' })
  @ApiResponse({
    status: 201,
    description: 'The source has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  createSource(@Body() createSourceDto: CreateSourceDto, @Req() req: Request) {
    return this.sourcesService.createSource(createSourceDto, req.user.user_id);
  }

  /**
   * Get all sources with pagination and filtering
   */
  @Post('search')
  @ApiOperation({ summary: 'Get all sources with pagination and filtering' })
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
    description: 'Returns all sources that match the filter criteria.',
  })
  async getAllSources(
    @Query() query: PaginationRequestDto,
    @Body() body: ApplyFiltersDto
  ) {
    return this.sourcesService.findAll(query, body.filters);
  }

  /**
   * Get cloud type labels
   */
  @Get('clouds')
  @ApiOperation({ summary: 'Get cloud type labels' })
  @ApiResponse({
    status: 200,
    description: 'Returns the available cloud type labels.',
  })
  async getCloudTypeLabels() {
    return Object.values(CloudType).map((cloud) => {
      return {
        cloud_type: cloud,
        label: this.sourcesService.getCloudTypeLabel(cloud),
      };
    });
  }

  /**
   * Get available filters for sources
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filters for sources' })
  @ApiResponse({
    status: 200,
    description: 'Returns the available filter options for sources.',
  })
  getSourceFilters() {
    return this.sourcesService.getAvailableFilters();
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
  getSourceFilterValues(
    @Param() params: FilterKeyParamsDto,
    @Query() query: FilterSearchQueryDto
  ) {
    return this.sourcesService.getFilterValues(params.filter_key, query);
  }

  /**
   * Get a single source by ID
   */
  @Get(':source_id')
  @ApiOperation({ summary: 'Get a single source by ID' })
  @ApiParam({ name: 'source_id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the source with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  async getSourceById(@Param() params: SourceIdParamsDto) {
    return this.sourcesService.findOne(params.source_id);
  }

  /**
   * Update a source
   */
  @Put(':source_id')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a source' })
  @ApiParam({ name: 'source_id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'The source has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  updateSource(
    @Param() params: SourceIdParamsDto,
    @Body() createSourceDto: CreateSourceDto,
    @Req() req: Request
  ) {
    return this.sourcesService.updateByUuid(
      params.source_id,
      createSourceDto,
      req.user.user_id
    );
  }

  /**
   * Delete a source
   */
  @Delete(':source_id')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a source' })
  @ApiParam({ name: 'source_id', description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'The source has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  deleteSource(@Param() params: SourceIdParamsDto, @Req() req: Request) {
    return this.sourcesService.removeSource(params.source_id, req.user.user_id);
  }
}
