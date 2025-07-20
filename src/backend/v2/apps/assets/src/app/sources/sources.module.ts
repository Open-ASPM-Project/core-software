import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import { defaultModuleImports } from '@firewall-backend/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Source } from '@firewall-backend/entities';
import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [
    ...defaultModuleImports(),
    TypeOrmModule.forFeature([Source]),
    SchedulesModule,
  ],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
