import { Module } from '@nestjs/common';
import { AssetGroupsService } from './asset-groups.service';
import { AssetGroupsController } from './asset-groups.controller';
import { defaultModuleImports } from '@firewall-backend/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetGroup, AssetToGroup } from '@firewall-backend/entities';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [
    ...defaultModuleImports(),
    TypeOrmModule.forFeature([AssetGroup, AssetToGroup]),
    AssetsModule,
  ],
  controllers: [AssetGroupsController],
  providers: [AssetGroupsService],
})
export class AssetGroupsModule {}
