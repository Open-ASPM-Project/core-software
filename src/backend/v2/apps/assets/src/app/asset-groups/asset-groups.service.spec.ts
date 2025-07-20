import { Test, TestingModule } from '@nestjs/testing';
import { AssetGroupsService } from './asset-groups.service';

describe('AssetGroupsService', () => {
  let service: AssetGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetGroupsService],
    }).compile();

    service = module.get<AssetGroupsService>(AssetGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
