import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SourceEventData } from '@firewall-backend/dto';
import { AssetWorkerService } from './asset.worker.service';
import { SourceIdParamsDto } from '../sources/dto/sources.dto';
import {
  GetSteampipeAssetsQueryDto,
  GetWebServersDto,
} from './dto/asset.worker.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Asset Worker')
@Controller('asset-worker')
export class AssetWorkerController {
  constructor(private readonly assetWorkerService: AssetWorkerService) {}

  /**
   * Trigger a scan for assets
   */
  @Post('scan')
  @ApiOperation({ summary: 'Trigger a scan for assets' })
  @ApiBody({ type: SourceEventData })
  @ApiResponse({
    status: 200,
    description: 'Scan request sent to the queue successfully.',
  })
  async triggerScan(@Body() body: SourceEventData) {
    await this.assetWorkerService.pushToQueue(body);
    return { message: 'Scan request sent to queue' };
  }

  /**
   * Discover assets for a source
   */
  @Get(':source_id/discover')
  @ApiOperation({ summary: 'Discover assets for a source' })
  @ApiQuery({ name: 'source_id', required: true, description: 'Source UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the discovered assets for the source.',
  })
  async discoverAssets(@Query() query: SourceIdParamsDto) {
    return await this.assetWorkerService.discoverAssets(query.source_id);
  }

  /**
   * Discover assets via Steampipe
   */
  @Get(':source_id/discover-steampipe')
  @ApiOperation({ summary: 'Discover assets via Steampipe' })
  @ApiQuery({ name: 'source_id', required: true, description: 'Source UUID' })
  @ApiQuery({
    name: 'sub_type',
    required: false,
    description: 'Optional subtype for asset discovery',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the discovered assets via Steampipe.',
  })
  async discoverAssetsSteampipe(@Query() query: GetSteampipeAssetsQueryDto) {
    return await this.assetWorkerService.discoverAssetsViaSteampipe(
      query.source_id,
      query.sub_type
    );
  }

  /**
   * Get open ports for a list of hosts
   */
  @Post('ports')
  @ApiOperation({ summary: 'Get open ports for a list of hosts' })
  @ApiBody({
    type: [String],
    description: 'List of hostnames or IPs to scan for open ports',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the open ports for the provided hosts.',
  })
  async getOpenPorts(@Body() body: string[]) {
    return await this.assetWorkerService.getOpenPorts(body);
  }

  /**
   * Get web servers for a list of hosts and ports
   */
  @Post('web-servers')
  @ApiOperation({ summary: 'Get web servers for a list of hosts and ports' })
  @ApiBody({
    type: [GetWebServersDto],
    description: 'List of hosts and ports to scan for web servers',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the discovered web servers.',
  })
  async getWebServers(@Body() body: GetWebServersDto[]) {
    return await this.assetWorkerService.getWebServers(body);
  }

  /**
   * Get screenshots for a list of URLs
   */
  @Post('screenshots')
  @ApiOperation({ summary: 'Get screenshots for a list of URLs' })
  @ApiBody({
    type: [String],
    description: 'List of URLs to capture screenshots for',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the screenshots for the provided URLs.',
  })
  async getScreenshots(@Body() body: string[]) {
    return await this.assetWorkerService.getScreenshots(body);
  }

  /**
   * Get web app APIs for a list of hosts
   */
  @Post('webapp-apis')
  @ApiOperation({ summary: 'Get web app APIs for a list of hosts' })
  @ApiBody({
    type: [String],
    description: 'List of hostnames or IPs to scan for web app APIs',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the discovered web app APIs.',
  })
  async getWebappApis(@Body() body: string[]) {
    return await this.assetWorkerService.getWebappApis(body, true);
  }

  /**
   * Filter web app APIs by URO
   */
  @Post('webapp-apis/filter')
  @ApiOperation({ summary: 'Filter web app APIs by URO' })
  @ApiBody({
    type: [String],
    description: 'List of UROs to filter web app APIs',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the filtered web app APIs based on UROs.',
  })
  async filterWebappApisByUro(@Body() body: string[]) {
    return await this.assetWorkerService.filterWebappApis(body, true);
  }
}
