import { Test, TestingModule } from '@nestjs/testing';
import { AssetGroupsController } from './asset-groups.controller';
import { AssetGroupsService } from './asset-groups.service';

describe('AssetsGroupsController', () => {
  let controller: AssetGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetGroupsController],
      providers: [AssetGroupsService],
    }).compile();

    controller = module.get<AssetGroupsController>(AssetGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
