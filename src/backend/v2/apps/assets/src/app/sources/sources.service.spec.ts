import { Test, TestingModule } from '@nestjs/testing';
import { SourcesService } from './sources.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Source } from './entities/source.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
import {
  mockCreateSourceDto,
  mockPaginationRequestDto,
  mockSource,
  mockSourceFilters,
  mockUpdateSourceDto,
} from './mocks/sources.mocks';

describe('SourcesService', () => {
  let service: SourcesService;
  const sourceRepositoryMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };
  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesService,
        {
          provide: getRepositoryToken(Source),
          useValue: sourceRepositoryMock,
        },
        {
          provide: getLoggerToken(SourcesService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<SourcesService>(SourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new source', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(undefined);
      sourceRepositoryMock.save.mockResolvedValue(mockSource);

      const result = await service.create(mockCreateSourceDto, 1);

      expect(sourceRepositoryMock.findOne).toHaveBeenCalled();
      expect(sourceRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual(mockSource);
    });

    it('should throw ConflictException if source name already exists', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(mockSource);

      await expect(service.create(mockCreateSourceDto, 1)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw error', async () => {
      await expect(service.create(null, 1)).rejects.toThrow(Error);
    });
  });

  describe('findAll', () => {
    it('should return all sources', async () => {
      sourceRepositoryMock.find.mockResolvedValue([mockSource]);
      sourceRepositoryMock.count.mockResolvedValue(1);

      const result = await service.findAll(mockPaginationRequestDto, [
        { filter_key: 'name', value: 'Test Cloud' },
        { filter_key: 'sort_by', value: 'name' },
        { filter_key: 'order_by', value: 'ASC' },
      ]);

      expect(sourceRepositoryMock.find).toHaveBeenCalled();
      expect(sourceRepositoryMock.count).toHaveBeenCalled();
      expect(result).toEqual({
        current_page: 1,
        current_limit: 10,
        total_count: 1,
        total_pages: 1,
        data: [mockSource],
      });
    });

    it('should throw error', async () => {
      await expect(service.findAll(null)).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('should return a source by id', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(mockSource);

      const result = await service.findOne('test-uuid');

      expect(sourceRepositoryMock.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockSource);
    });

    it('should throw error', async () => {
      sourceRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.findOne('test')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update a source', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(mockSource);
      sourceRepositoryMock.save.mockResolvedValue({
        ...mockSource,
        ...mockUpdateSourceDto,
      });

      const result = await service.update('test-uuid', mockUpdateSourceDto, 1);

      expect(sourceRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid', deleted: false },
      });
      expect(sourceRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockSource, ...mockUpdateSourceDto });
    });

    it('should throw NotFoundException if source is not found', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(
        service.update('test-uuid', mockUpdateSourceDto, 1)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error', async () => {
      sourceRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.update(null, null, null)).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should remove a source', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(mockSource);
      sourceRepositoryMock.save.mockResolvedValue({
        ...mockSource,
        deleted: true,
      });

      const result = await service.remove('test-uuid', 1);

      expect(sourceRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid' },
      });
      expect(sourceRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockSource, deleted: true });
    });

    it('should throw NotFoundException if source is not found', async () => {
      sourceRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(service.remove('test-uuid', 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw error', async () => {
      sourceRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.remove(null, null)).rejects.toThrow(Error);
    });
  });

  describe('getAvailableFilters', () => {
    it('should return available filters', () => {
      const result = service.getAvailableFilters();

      expect(result).toEqual(mockSourceFilters);
    });
  });

  describe('getFilterValues', () => {
    it('should return filter values for source_type', async () => {
      sourceRepositoryMock.findAndCount.mockResolvedValue([
        [{ sourceType: 'cloud' }],
        1,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'source_type',
        search: 'cloud',
      });

      expect(sourceRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['cloud'], total_count: 1 });
    });

    it('should return filter values for name', async () => {
      sourceRepositoryMock.findAndCount.mockResolvedValue([
        [{ name: 'test1' }, { name: 'test2' }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'name' });

      expect(sourceRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['test1', 'test2'], total_count: 2 });
    });

    it('should return filter values for cloud_type', async () => {
      sourceRepositoryMock.findAndCount.mockResolvedValue([
        [{ cloudType: 'aws' }, { cloudType: 'gcp' }],
        2,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'cloud_type',
      });

      expect(sourceRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['aws', 'gcp'], total_count: 2 });
    });

    it('should return filter values for active', async () => {
      sourceRepositoryMock.findAndCount.mockResolvedValue([
        [{ active: true }, { active: false }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'active' });

      expect(sourceRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: [true, false], total_count: 2 });
    });

    it('should return filter values for deleted', async () => {
      sourceRepositoryMock.findAndCount.mockResolvedValue([
        [{ deleted: true }, { deleted: false }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'deleted' });

      expect(sourceRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: [true, false], total_count: 2 });
    });

    it('should return filter values for sort_by', async () => {
      const result = await service.getFilterValues({ filter_key: 'sort_by' });

      expect(result).toEqual({
        values: [
          'sourceType',
          'cloudType',
          'name',
          'active',
          'deleted',
          'createdAt',
          'updatedAt',
        ],
        total_count: 7,
      });
    });

    it('should return filter values for order_by', async () => {
      const result = await service.getFilterValues({ filter_key: 'order_by' });

      expect(result).toEqual({ values: ['ASC', 'DESC'], total_count: 2 });
    });

    it('should throw BadRequestException for invalid filter_key', async () => {
      await expect(
        service.getFilterValues({ filter_key: 'invalid' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error', async () => {
      sourceRepositoryMock.findAndCount.mockRejectedValue(new Error());
      await expect(
        service.getFilterValues({ filter_key: 'name' })
      ).rejects.toThrow(Error);
    });
  });
});
