import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
} from './dtos/configuration.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RolesGuard } from '@firewall-backend/guards';
import { Roles } from '@firewall-backend/decorators';
import { UserRole } from '@firewall-backend/enums';
import { Configuration } from '@firewall-backend/entities';

@ApiTags('Configuration')
@Controller('configurations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  @Roles(UserRole.Admin, UserRole.User, UserRole.ReadOnly)
  @UseGuards(RolesGuard)
  async getAll(@Query('name') name: string): Promise<Configuration[]> {
    return this.configurationService.findAll(name);
  }

  @Get(':uuid')
  @Roles(UserRole.Admin, UserRole.User, UserRole.ReadOnly)
  @UseGuards(RolesGuard)
  async getOne(@Param('uuid') uuid: string): Promise<Configuration> {
    return this.configurationService.findOne(uuid);
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateConfigurationDto): Promise<Configuration> {
    return this.configurationService.create(dto);
  }

  @Put(':uuid')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  async updateOne(
    @Param('uuid') uuid: string,
    @Body() dto: UpdateConfigurationDto
  ): Promise<Configuration> {
    return this.configurationService.updateOne(uuid, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(RolesGuard)
  async remove(@Param('uuid') uuid: string): Promise<void> {
    return this.configurationService.remove(uuid);
  }
}
