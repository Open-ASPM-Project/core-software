import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { defaultModuleImports } from '@firewall-backend/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  Schedule,
  ScheduleRun,
  Source,
} from '@firewall-backend/entities';
import { ScheduleRunService } from './schedule-run.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MessagePubSubModule } from '@firewall-backend/message-pub-sub';

@Module({
  imports: [
    ...defaultModuleImports(),
    TypeOrmModule.forFeature([Schedule, ScheduleRun, Asset, Source]),
    MessagePubSubModule.forRoot({
      adapter: 'rabbitmq',
      rabbitUrl: process.env.RABBITMQ_URL,
      rabbitExchange: 'asset-exchange',
      rabbitQueueName: 'asset-queue',
    }),
    ScheduleModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleRunService],
  exports: [SchedulesService, ScheduleRunService],
})
export class SchedulesModule {}
