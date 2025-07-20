import { Test, TestingModule } from '@nestjs/testing';
import { AssetWorkerController } from './asset.worker.controller';
import { AssetWorker } from './asset.worker';

describe('WorkerController', () => {
  let controller: AssetWorkerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetWorkerController],
      providers: [AssetWorker],
    }).compile();

    controller = module.get<AssetWorkerController>(AssetWorkerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
