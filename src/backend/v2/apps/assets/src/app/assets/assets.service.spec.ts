import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';
import {
  mockAsset,
  mockAssetFilters,
  mockCreateAssetDto,
  mockPaginationRequestDto,
  mockUpdateAssetDto,
} from './mocks/assets.mocks';
import { Source } from '../sources/entities/source.entity';
import { AssetToSource } from './entities/asset-to-source.entity';
import { ScansService } from '../scans/scans.service';

describe('AssetsService', () => {
  let service: AssetsService;
  const assetRepositoryMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  };

  const sourceRepositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const assetToSourceRepositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const scansServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: ScansService,
          useValue: scansServiceMock,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: assetRepositoryMock,
        },
        {
          provide: getRepositoryToken(Source),
          useValue: sourceRepositoryMock,
        },
        {
          provide: getRepositoryToken(AssetToSource),
          useValue: assetToSourceRepositoryMock,
        },
        {
          provide: getLoggerToken(AssetsService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(undefined);
      assetRepositoryMock.save.mockResolvedValue(mockAsset);

      const result = await service.create(mockCreateAssetDto, 1);

      expect(assetRepositoryMock.findOne).toHaveBeenCalled();
      expect(assetRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual(mockAsset);
    });

    it('should throw ConflictException if asset name already exists', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(mockCreateAssetDto);

      await expect(service.create(mockCreateAssetDto, 1)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw error', async () => {
      assetRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.create(mockCreateAssetDto, 1)).rejects.toThrow(
        Error
      );
    });
  });

  describe('findAll', () => {
    it('should return all assets', async () => {
      assetRepositoryMock.find.mockResolvedValue([mockAsset]);
      assetRepositoryMock.count.mockResolvedValue(1);

      const result = await service.findAll(mockPaginationRequestDto, [
        { filter_key: 'name', value: 'Test Domain' },
        { filter_key: 'sort_by', value: 'name' },
        { filter_key: 'order_by', value: 'ASC' },
      ]);

      expect(assetRepositoryMock.find).toHaveBeenCalled();
      expect(assetRepositoryMock.count).toHaveBeenCalled();
      expect(result).toEqual({
        current_page: 1,
        current_limit: 10,
        total_count: 1,
        total_pages: 1,
        data: [mockAsset],
      });
    });

    it('should throw error', async () => {
      assetRepositoryMock.find.mockRejectedValue(new Error());
      await expect(service.findAll(null)).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('should return a asset by id', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(mockAsset);

      const result = await service.findOne('test-uuid');

      expect(assetRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid', deleted: false },
      });
      expect(result).toEqual(mockAsset);
    });

    it('should throw error', async () => {
      assetRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.findOne('test')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update a asset', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(mockAsset);
      assetRepositoryMock.save.mockResolvedValue({
        ...mockAsset,
        ...mockUpdateAssetDto,
      });

      const result = await service.update('test-uuid', mockUpdateAssetDto, 1);

      expect(assetRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid', deleted: false },
      });
      expect(assetRepositoryMock.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockAsset, ...mockUpdateAssetDto });
    });

    it('should throw NotFoundException if asset is not found', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(
        service.update('test', mockUpdateAssetDto, 1)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error', async () => {
      assetRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.update('test', null, 1)).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should remove a asset', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(mockAsset);
      assetRepositoryMock.save.mockResolvedValue({
        ...mockAsset,
        deleted: true,
      });

      const result = await service.remove('test-uuid', 1);

      expect(assetRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid' },
      });
      expect(assetRepositoryMock.save).toHaveBeenCalledWith({
        ...mockAsset,
        deleted: true,
        updatedByUid: 1,
      });
      expect(result).toEqual({ ...mockAsset, deleted: true });
    });

    it('should throw NotFoundException if asset is not found', async () => {
      assetRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(service.remove('test', 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw error', async () => {
      assetRepositoryMock.findOne.mockRejectedValue(new Error());
      await expect(service.remove(null, 1)).rejects.toThrow(Error);
    });
  });

  describe('getAvailableFilters', () => {
    it('should return available filters', () => {
      const result = service.getAvailableFilters();

      expect(result).toEqual(mockAssetFilters);
    });
  });

  describe('getFilterValues', () => {
    it('should return filter values for asset_type', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ assetType: 'ip' }, { assetType: 'domain' }],
        2,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'asset_type',
      });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['ip', 'domain'], total_count: 2 });
    });

    it('should return filter values for name', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ name: 'test1' }, { name: 'test2' }],
        2,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'name',
        search: 'test',
      });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['test1', 'test2'], total_count: 2 });
    });

    it('should return filter values for url', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ url: 'test1' }, { url: 'test2' }],
        2,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'url',
        search: 'test',
      });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['test1', 'test2'], total_count: 2 });
    });

    it('should return filter values for ip_type', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ ipType: 'ipv4' }, { ipType: 'ipv6' }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'ip_type' });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['ipv4', 'ipv6'], total_count: 2 });
    });

    it('should return filter values for ip_address', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ ipAddress: 'test1' }, { ipAddress: 'test2' }],
        2,
      ]);

      const result = await service.getFilterValues({
        filter_key: 'ip_address',
      });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: ['test1', 'test2'], total_count: 2 });
    });

    it('should return filter values for port', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ port: 45 }, { port: 18 }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'port' });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: [45, 18], total_count: 2 });
    });

    it('should return filter values for active', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ active: true }, { active: false }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'active' });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: [true, false], total_count: 2 });
    });

    it('should return filter values for deleted', async () => {
      assetRepositoryMock.findAndCount.mockResolvedValue([
        [{ deleted: true }, { deleted: false }],
        2,
      ]);

      const result = await service.getFilterValues({ filter_key: 'deleted' });

      expect(assetRepositoryMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ values: [true, false], total_count: 2 });
    });

    it('should return filter values for sort_by', async () => {
      const result = await service.getFilterValues({ filter_key: 'sort_by' });

      expect(result).toEqual({
        values: [
          'assetType',
          'name',
          'url',
          'ipType',
          'ipAddress',
          'port',
          'active',
          'deleted',
          'createdAt',
          'updatedAt',
        ],
        total_count: 10,
      });
    });

    it('should return filter values for order_by', async () => {
      const result = await service.getFilterValues({ filter_key: 'order_by' });

      expect(result).toEqual({ values: ['ASC', 'DESC'], total_count: 2 });
    });

    it('should throw BadRequestException for invalid filter key', async () => {
      await expect(
        service.getFilterValues({ filter_key: 'invalid' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error', async () => {
      assetRepositoryMock.findAndCount.mockRejectedValue(new Error());
      await expect(
        service.getFilterValues({ filter_key: 'name' })
      ).rejects.toThrow(Error);
    });
  });
});
