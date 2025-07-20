import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { SourcesModule } from './sources/sources.module';
import { AssetsModule } from './assets/assets.module';
import {
  Activity,
  Asset,
  AssetGroup,
  AssetScreenshot,
  AssetToSource,
  Comments,
  Configuration,
  AssetToGroup,
  Incident,
  Schedule,
  Source,
  User,
  Vulnerability,
  VulnerabilityScan,
  ScheduleRun,
  AssetScan,
  Ec2ToWebapp,
  Ec2ToSecurityGroup,
} from '@firewall-backend/entities';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetGroupsModule } from './asset-groups/asset-groups.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AssetWorkerModule } from './worker/asset.worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [
        User,
        Source,
        Asset,
        AssetToSource,
        AssetScan,
        Ec2ToWebapp,
        Ec2ToSecurityGroup,
        Schedule,
        ScheduleRun,
        AssetToGroup,
        AssetGroup,
        AssetScreenshot,
        Vulnerability,
        Configuration,
        VulnerabilityScan,
        Incident,
        Comments,
        Activity,
      ],
      synchronize: process.env.TYPEORM_SYNC === 'true',
    }),
    ScheduleModule.forRoot(),
    SourcesModule,
    AssetsModule,
    SchedulesModule,
    AssetGroupsModule,
    ...(process.env.ENABLE_ASSET_WORKER === 'true' ? [AssetWorkerModule] : []),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
