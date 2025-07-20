import { Request } from 'express';
import { AssetType, FilterType } from '@firewall-backend/enums';
import {
  CreateAssetDto,
  PaginationRequestDto,
  UpdateAssetDto,
} from '@firewall-backend/dto';
import { Asset } from '@firewall-backend/entities';

export const mockRequest = {
  user: {
    user_id: 1,
  },
} as Request;

export const mockCreateAssetDto: CreateAssetDto = {
  type: AssetType.DOMAIN,
  active: true,
  sourceId: 'test-uuid',
  domain: {
    url: 'test.com',
  },
};

export const mockAsset: Asset = {
  id: 1,
  uuid: 'test-uuid',
  type: AssetType.DOMAIN,
  active: true,
  deleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPaginationRequestDto: PaginationRequestDto = {
  page: 1,
  limit: 10,
};

export const mockUpdateAssetDto: UpdateAssetDto = {
  active: false,
};

export const mockAssetFilters = [
  {
    key: 'asset_type',
    label: 'Asset Type',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'name',
    label: 'Name',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'url',
    label: 'Domain or Subdomain URL',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'ip_type',
    label: 'IP Type',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'ip',
    label: 'IP Address',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'port',
    label: 'Port',
    type: FilterType.INTEGER,
    searchable: true,
  },
  {
    key: 'active',
    label: 'Active',
    type: FilterType.BOOLEAN,
    searchable: false,
  },
  {
    key: 'deleted',
    label: 'Deleted',
    type: FilterType.BOOLEAN,
    searchable: false,
  },
  {
    key: 'sort_by',
    label: 'Sort By',
    type: FilterType.STRING,
    searchable: false,
  },
  {
    key: 'order_by',
    label: 'Order By',
    type: FilterType.STRING,
    searchable: false,
  },
];
