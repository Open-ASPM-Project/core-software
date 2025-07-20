import { Test, TestingModule } from '@nestjs/testing';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { JwtService } from '@nestjs/jwt';
import {
  mockCreateSourceDto,
  mockPaginationRequestDto,
  mockRequest,
  mockSource,
  mockSourceFilters,
  mockUpdateSourceDto,
} from './mocks/sources.mocks';

describe('SourcesController', () => {
  let controller: SourcesController;
  let service: SourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SourcesController],
      providers: [
        {
          provide: SourcesService,
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

    controller = module.get<SourcesController>(SourcesController);
    service = module.get<SourcesService>(SourcesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSource', () => {
    it('should return the created source', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockSource);
      const result = await controller.createSource(
        mockCreateSourceDto,
        mockRequest
      );

      expect(service.create).toHaveBeenCalledWith(
        mockCreateSourceDto,
        mockRequest.user.user_id
      );
      expect(result).toEqual(mockSource);
    });
  });

  describe('getAllSources', () => {
    it('should return multiple sources', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue({
        current_limit: 10,
        current_page: 1,
        total_count: 0,
        total_pages: 0,
        data: [],
      });
      const result = await controller.getAllSources(mockPaginationRequestDto, {
        filters: [
          { filter_key: 'name', value: 'Test Cloud' },
          { filter_key: 'sort_by', value: 'name' },
          { filter_key: 'order_by', value: 'ASC' },
        ],
      });

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        current_limit: 10,
        current_page: 1,
        total_count: 0,
        total_pages: 0,
        data: [],
      });
    });
  });

  describe('getSourceById', () => {
    it('should return single source', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSource);
      const result = await controller.getSourceById({ source_id: 'test-uuid' });

      expect(service.findOne).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockSource);
    });
  });

  describe('updateSource', () => {
    it('should update the source', async () => {
      jest
        .spyOn(service, 'update')
        .mockResolvedValue({ ...mockSource, ...mockUpdateSourceDto });
      const result = await controller.updateSource(
        { source_id: 'test-uuid' },
        mockUpdateSourceDto,
        mockRequest
      );

      expect(service.update).toHaveBeenCalledWith(
        'test-uuid',
        mockUpdateSourceDto,
        mockRequest.user.user_id
      );
      expect(result).toEqual({ ...mockSource, ...mockUpdateSourceDto });
    });
  });

  describe('deleteSource', () => {
    it('should delete the source', async () => {
      jest
        .spyOn(service, 'remove')
        .mockResolvedValue({ ...mockSource, deleted: true });
      const result = await controller.deleteSource(
        { source_id: 'test-uuid' },
        mockRequest
      );

      expect(service.remove).toHaveBeenCalledWith(
        'test-uuid',
        mockRequest.user.user_id
      );
      expect(result).toEqual({ ...mockSource, deleted: true });
    });
  });

  describe('getSourceFilters', () => {
    it('should return source filters', async () => {
      jest
        .spyOn(service, 'getAvailableFilters')
        .mockReturnValue(mockSourceFilters);
      const result = controller.getSourceFilters();

      expect(service.getAvailableFilters).toHaveBeenCalled();
      expect(result).toEqual(mockSourceFilters);
    });
  });

  describe('getSourceFilterValues', () => {
    it('should return source filter values', async () => {
      const mockQuery = { page: 1, limit: 10, filter_key: 'name' };
      jest
        .spyOn(service, 'getFilterValues')
        .mockResolvedValue({ values: [], total_count: 0 });
      const result = await controller.getSourceFilterValues(mockQuery);

      expect(service.getFilterValues).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({ values: [], total_count: 0 });
    });
  });
});
