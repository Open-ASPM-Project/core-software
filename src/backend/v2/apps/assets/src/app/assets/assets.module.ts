import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { defaultModuleImports } from '@firewall-backend/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetScan,
  AssetScreenshot,
  AssetToSource,
  Ec2ToSecurityGroup,
  Ec2ToWebapp,
} from '@firewall-backend/entities';
import { AssetsUtils } from './assets.utils';
import { SchedulesModule } from '../schedules/schedules.module';
import { SourcesModule } from '../sources/sources.module';

@Module({
  imports: [
    ...defaultModuleImports(),
    TypeOrmModule.forFeature([
      Asset,
      AssetToSource,
      AssetScreenshot,
      AssetScan,
      Ec2ToSecurityGroup,
      Ec2ToWebapp,
    ]),
    SchedulesModule,
    SourcesModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService, AssetsUtils],
  exports: [AssetsService],
})
export class AssetsModule {}
