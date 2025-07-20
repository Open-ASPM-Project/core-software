'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { useSearchParams } from 'react-router-dom';
import {
  VMSubdomainAssetTable,
  type PaginatedResponse as SubdomainPaginatedResponse,
} from '../tables/VMSubdomainAssetTable';
import {
  VMWebappAssetTable,
  type PaginatedResponse as WebappPaginatedResponse,
} from '../tables/VMWebappAssetTable';
import {
  VMIpAssetTable,
  type PaginatedResponse as IpPaginatedResponse,
} from '../tables/VMIpAssetTable';
import {
  VMDomainAssetTable,
  type PaginatedResponse as DomainPaginatedResponse,
} from '../tables/VMDomainAssetTable';
import {
  VMServiceAssetTable,
  type PaginatedResponse as ServicePaginatedResponse,
} from '../tables/VMServiceAssetTable';
import { Loader } from '@/components/ui/loader';

interface VMAssetsTabProps {
  commonAPIRequest: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

interface AssetResponse {
  current_page: number;
  current_limit: number;
  total_count: number;
  total_pages: number;
  data: {
    uuid: string;
    active: boolean;
    type: string;
    name: string | null;
    url: string;
    createdAt: string;
    updatedAt: string;
    addedBy: {
      active: boolean;
      userEmail: string;
      username: string;
    } | null;
    updatedBy: {
      active: boolean;
      userEmail: string;
      username: string;
    } | null;
    port?: number;
    domainAsset: {
      uuid: string;
      active: boolean;
      type: string;
      name: string | null;
      url: string;
    } | null;
    subdomainAsset: {
      uuid: string;
      active: boolean;
      type: string;
      name: string | null;
      url: string;
      domainAsset: {
        uuid: string;
        active: boolean;
        type: string;
        name: string | null;
        url: string;
      } | null;
    } | null;
    ipAsset: {
      uuid: string;
      active: boolean;
      type: string;
      name: string | null;
      ipAddress: string;
      ipType: string;
    } | null;
  }[];
}

const VMAssetsTabBase = ({ commonAPIRequest }: VMAssetsTabProps) => {
  const [selectedAssetType, setSelectedAssetType] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [assetTypes, setAssetTypes] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [assets, setAssets] = React.useState<AssetResponse | null>(null);
  const [searchParams] = useSearchParams();

  // Fetch asset types
  React.useEffect(() => {
    let isMounted = true;
    const currentTab = searchParams.get('tab');

    // Only fetch if we're on the assets tab
    if (currentTab === 'assets' && !assetTypes.length) {
      const fetchAssetTypes = async () => {
        setIsLoading(true);
        const endpoint = API_ENDPOINTS.vm.getAssetsFiltersValues;
        const apiUrl = createEndpointUrl(endpoint, { filter_key: 'asset_type' });

        commonAPIRequest(
          {
            api: apiUrl,
            method: endpoint.method,
          },
          (response: { values: string[] } | null) => {
            if (!isMounted) return;

            setIsLoading(false);
            if (response?.values && response.values.length > 0) {
              setAssetTypes(response.values);
              setSelectedAssetType(response.values[0]);
            }
          }
        );
      };

      fetchAssetTypes();
    }

    return () => {
      isMounted = false;
    };
  }, [searchParams, assetTypes.length]);

  // Fetch assets based on type, search query and page
  React.useEffect(() => {
    let isMounted = true;

    if (selectedAssetType) {
      const fetchAssets = async () => {
        setIsLoading(true);
        const endpoint = API_ENDPOINTS.vm.getAssets;
        const apiUrl = createEndpointUrl(endpoint);

        const filters = [
          {
            filter_key: 'asset_type',
            value: selectedAssetType,
          },
        ];

        // Add search filter if search query exists
        if (searchQuery.trim()) {
          filters.push({
            filter_key: 'name',
            value: searchQuery.trim(),
          });
        }

        commonAPIRequest(
          {
            api: `${apiUrl}?page=${currentPage}&limit=10`,
            method: endpoint.method,
            data: {
              filters,
            },
          },
          (response: AssetResponse | null) => {
            if (!isMounted) return;
            setIsLoading(false);
            setAssets(response);
          }
        );
      };

      // Add debounce to prevent too many API calls while typing
      const timeoutId = setTimeout(() => {
        fetchAssets();
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
  }, [selectedAssetType, currentPage, searchQuery]);

  const handleAssetTypeChange = (value: string) => {
    setSelectedAssetType(value);
    setCurrentPage(1); // Reset to first page when changing asset type
    setAssets(null); // Clear assets when changing type
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderTableContent = () => {
    // Show loader when loading or when switching asset types (assets is null)
    if (isLoading || !assets) {
      return (
        <div className="flex justify-center items-center py-24 border rounded-md bg-card">
          <Loader size="lg" text={`Loading ${selectedAssetType} assets...`} className="h-full" />
        </div>
      );
    }

    if (selectedAssetType === 'subdomain') {
      // Type assertion for subdomain assets
      return (
        <VMSubdomainAssetTable
          data={assets as unknown as SubdomainPaginatedResponse}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      );
    }

    if (selectedAssetType === 'webapp') {
      // Type assertion for webapp assets
      return (
        <VMWebappAssetTable
          data={assets as unknown as WebappPaginatedResponse}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      );
    }

    if (selectedAssetType === 'ip') {
      // Type assertion for IP assets
      return (
        <VMIpAssetTable
          data={assets as unknown as IpPaginatedResponse}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      );
    }

    if (selectedAssetType === 'domain') {
      // Type assertion for domain assets
      return (
        <VMDomainAssetTable
          data={assets as unknown as DomainPaginatedResponse}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      );
    }

    if (selectedAssetType === 'service') {
      // Type assertion for service assets
      return (
        <VMServiceAssetTable
          data={assets as unknown as ServicePaginatedResponse}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      );
    }

    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-lg font-medium text-muted-foreground">
          {selectedAssetType.charAt(0).toUpperCase() + selectedAssetType.slice(1)} table coming
          soon...
        </p>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Search and Filter Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" className="h-10">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Select
            value={selectedAssetType}
            onValueChange={handleAssetTypeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Section */}
      {assets && (
        <div className="flex items-center gap-4">
          <div className="rounded-md border px-3 py-1 text-sm">
            Total Assets: {assets.total_count}
          </div>
          <div className="rounded-md border px-3 py-1 text-sm">
            Active: {assets.data.filter((asset) => asset.active).length}
          </div>
          <div className="rounded-md border px-3 py-1 text-sm">
            Inactive: {assets.data.filter((asset) => !asset.active).length}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="rounded-md border">{renderTableContent()}</div>
    </div>
  );
};

export const VMAssetsTab = withAPIRequest(VMAssetsTabBase);
