import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { defaultModuleImports } from '@firewall-backend/utils';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { Configuration } from '@firewall-backend/entities';

@Module({
  imports: [
    ...defaultModuleImports(),
    TypeOrmModule.forFeature([Configuration]),
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
