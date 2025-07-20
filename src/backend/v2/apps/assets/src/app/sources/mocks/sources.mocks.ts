import { Request } from 'express';
import { CreateSourceDto } from '../dto/sources.dto';
import { PaginationRequestDto } from '@firewall-backend/dto';
import { CloudType, FilterType, SourceType } from '@firewall-backend/enums';
import { Filter } from '@firewall-backend/types';
import { Source } from '@firewall-backend/entities';

export const mockCreateSourceDto: CreateSourceDto = {
  type: SourceType.CLOUD,
  name: 'Test Cloud',
  active: true,
  cloud: {
    cloudType: CloudType.AWS,
    azure: {
      tenantId: 'test-tenant',
      subscriptionId: 'test-subscription',
      clientId: 'test-client',
      clientSecret: 'test-secret',
    },
  },
};

export const mockSource: Source = {
  id: 1,
  uuid: 'test-uuid',
  type: SourceType.CLOUD,
  name: 'Test Cloud',
  active: true,
  deleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  cloudType: CloudType.AWS,
  clientId: 'test-client',
  clientSecret: 'test-secret',
};

export const mockPaginationRequestDto: PaginationRequestDto = {
  page: 1,
  limit: 10,
};

export const mockRequest = {
  user: {
    user_id: 1,
  },
} as Request;

export const mockSourceFilters: Filter[] = [
  {
    key: 'source_type',
    label: 'Source Type',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'name',
    label: 'Source Name',
    type: FilterType.STRING,
    searchable: true,
  },
  {
    key: 'cloud_type',
    label: 'Cloud Type',
    type: FilterType.STRING,
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
