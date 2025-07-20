import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { LicensesController } from './license.controller';
import { LicensesService } from './license.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { License } from './license.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([License])
  ],
  controllers: [LicensesController],
  providers: [LicensesService],
})
export class LicenseModule {}
