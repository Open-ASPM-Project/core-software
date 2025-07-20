import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { JwtService } from '@nestjs/jwt';
import {
  mockAsset,
  mockAssetFilters,
  mockCreateAssetDto,
  mockPaginationRequestDto,
  mockRequest,
  mockUpdateAssetDto,
} from './mocks/assets.mocks';

describe('AssetsController', () => {
  let controller: AssetsController;
  let service: AssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getAvailableFilters: jest.fn(),
            getFilterValues: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    service = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAsset', () => {
    it('should create an asset', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockAsset);
      const result = await controller.createAsset(
        mockCreateAssetDto,
        mockRequest
      );
      expect(service.create).toHaveBeenCalledWith(
        mockCreateAssetDto,
        mockRequest.user.user_id
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('getAllAssets', () => {
    it('should return multiple assets', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue({
        current_limit: 10,
        current_page: 1,
        total_count: 1,
        total_pages: 1,
        data: [mockAsset],
      });
      const result = await controller.getAllAssets(mockPaginationRequestDto, {
        filters: [
          { filter_key: 'name', value: 'Test Domain' },
          { filter_key: 'sort_by', value: 'name' },
          { filter_key: 'order_by', value: 'ASC' },
        ],
      });
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        current_limit: 10,
        current_page: 1,
        total_count: 1,
        total_pages: 1,
        data: [mockAsset],
      });
    });
  });

  describe('getAssetById', () => {
    it('should return a single asset', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsset);
      const result = await controller.getAssetById({ asset_id: 'test-uuid' });
      expect(service.findOne).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockAsset);
    });
  });

  describe('updateAsset', () => {
    it('should update as asset', async () => {
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...mockAsset, ...mockUpdateAssetDto });
      const result = await controller.updateAsset(
        { asset_id: 'test-uuid' },
        mockUpdateAssetDto,
        mockRequest
      );
      expect(service.update).toHaveBeenCalledWith(
        'test-uuid',
        mockUpdateAssetDto,
        mockRequest.user.user_id
      );
      expect(result).toEqual({ ...mockAsset, ...mockUpdateAssetDto });
    });
  });

  describe('deleteAsset', () => {
    it('should delete an asset', async () => {
      jest
        .spyOn(service, 'remove')
        .mockResolvedValue({ ...mockAsset, deleted: true });
      const result = await controller.deleteAsset(
        { asset_id: 'test-uuid' },
        mockRequest
      );
      expect(service.remove).toHaveBeenCalledWith(
        'test-uuid',
        mockRequest.user.user_id
      );
      expect(result).toEqual({ ...mockAsset, deleted: true });
    });
  });

  describe('getAssetFilters', () => {
    it('should return all available filters', async () => {
      jest
        .spyOn(service, 'getAvailableFilters')
        .mockReturnValue(mockAssetFilters);
      const result = controller.getAssetFilters();
      expect(service.getAvailableFilters).toHaveBeenCalledWith();
      expect(result).toEqual(mockAssetFilters);
    });
  });

  describe('getAssetFilterValues', () => {
    it('should return filter values', async () => {
      jest.spyOn(service, 'getFilterValues').mockResolvedValue({
        values: [],
        total_count: 0,
      });
      const mockQuery = { page: 1, limit: 10, filter_key: 'name' };
      const result = await controller.getAssetFilterValues(mockQuery);
      expect(service.getFilterValues).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({ values: [], total_count: 0 });
    });
  });
});
