import { Test, TestingModule } from '@nestjs/testing';
import { AssetWorker } from './asset.worker';

describe('AssetWorker', () => {
  let service: AssetWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetWorker],
    }).compile();

    service = module.get<AssetWorker>(AssetWorker);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
