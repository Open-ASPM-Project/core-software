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
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  ScheduleIdParamsDto,
  UpdateScheduleDto,
} from './dto/schedules.dto';
import { AuthGuard, RolesGuard } from '@firewall-backend/guards';
import {
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@firewall-backend/decorators';
import { UserRole } from '@firewall-backend/enums';
import { Request } from 'express';
import {
  AssetIdsParamsDto,
  FilterKeyParamsDto,
  FilterSearchQueryDto,
  PaginationRequestDto,
} from '@firewall-backend/dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(AuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({
    status: 201,
    description: 'The schedule has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createScheduleDto: CreateScheduleDto, @Req() req: Request) {
    return this.schedulesService.createSchedule(
      createScheduleDto,
      req.user.user_id
    );
  }

  /**
   * Get all schedules with pagination and filtering
   */
  @Post('search')
  @ApiOperation({ summary: 'Get all schedules with pagination and filtering' })
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
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    type: String,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Return all schedules that match the filter criteria.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getAllSchedules(
    @Query() query: PaginationRequestDto,
    @Query('filter') filters?: string
  ) {
    // Parse filters from query string if provided
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.schedulesService.findAll(query, parsedFilters);
  }

  /**
   * Get available filters for schedules
   */
  @Get('filters')
  @ApiOperation({ summary: 'Get available filters for schedules' })
  @ApiResponse({
    status: 200,
    description: 'Returns the available filter options for schedules.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getScheduleFilters() {
    return this.schedulesService.getAvailableFilters();
  }

  /**
   * Get filter values for a specific filter
   */
  @Get('filters/:filter_key/values')
  @ApiOperation({ summary: 'Get values for a specific filter' })
  @ApiParam({
    name: 'filterName',
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
  @ApiResponse({ status: 400, description: 'Invalid filter name.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getScheduleFilterValues(
    @Param() params: FilterKeyParamsDto,
    @Query() query: FilterSearchQueryDto
  ) {
    return this.schedulesService.getFilterValues(params.filter_key, query);
  }

  @Get(':schedule_id')
  @ApiOperation({ summary: 'Get a single schedule by ID' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the schedule with the specified ID.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Schedule not found.' })
  findOne(@Param() params: ScheduleIdParamsDto) {
    return this.schedulesService.findOne(params.schedule_id);
  }

  @Put(':schedule_id')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule UUID' })
  @ApiResponse({
    status: 200,
    description: 'The schedule has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  update(
    @Param() params: ScheduleIdParamsDto,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: Request
  ) {
    return this.schedulesService.updateSchedule(
      params.schedule_id,
      updateScheduleDto,
      req.user.user_id
    );
  }

  @Delete(':schedule_id')
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule UUID' })
  @ApiResponse({
    status: 200,
    description: 'The schedule has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  remove(@Param() params: ScheduleIdParamsDto, @Req() req: Request) {
    return this.schedulesService.removeSchedule(
      params.schedule_id,
      req.user.user_id
    );
  }

  @Put(':schedule_id/assets')
  @ApiOperation({ summary: 'Add or update assets for a schedule' })
  @ApiParam({ name: 'schedule_id', description: 'Schedule UUID' })
  @ApiResponse({
    status: 200,
    description: 'The assets have been successfully added to the schedule.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule not found.' })
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  addAssets(
    @Param() params: ScheduleIdParamsDto,
    @Body() assetIdsDto: AssetIdsParamsDto,
    @Req() req: Request
  ) {
    return this.schedulesService.addAssetsToSchedule(
      params.schedule_id,
      assetIdsDto.assetIds,
      req.user.user_id
    );
  }
}
