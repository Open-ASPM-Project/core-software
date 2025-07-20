import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import debounce from 'lodash/debounce';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AllowListTable from '../table/allowlist/AllowListTable';
import AddAllowListDialog from '../dialogs/allowlist/AddAllowListDialog';
import { AllowlistFilters } from '../components/allowlist/AllowlistFilters';
import AddAssetsAllowListDialog from '../dialogs/allowlist/AddAssetsAllowListDialog';
import ViewAssetAllowlistDialog from '../dialogs/allowlist/ViewAssetAllowlistDialog';

interface VCS {
  id: number;
  name: string;
}

interface Repo {
  id: number;
  name: string;
}

interface AllowList {
  id: number;
  type: string;
  name: string;
  active: boolean;
  global_: boolean;
  created_on: string;
  vcs: VCS[];
  repos: Repo[];
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  data: AllowList[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'name' | 'type' | 'created_on' | 'active';
}

interface AllowListTabProps {
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

const AllowListTab: React.FC<AllowListTabProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [allowList, setAllowList] = React.useState<PaginatedResponse | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [assetAllowlistDialogOpen, setAssetAllowlistDialogOpen] = React.useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'created_on';

  const fetchAllowList = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.allowList.getAllowList;
      const apiUrl = createEndpointUrl(endpoint);

      // Create query string manually
      const queryParts: string[] = [`page=${params.page}`, `limit=${params.limit}`, 'type=SECRET'];

      if (params.search) queryParts.push(`search=${params.search}`);
      if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`);
      if (params.order_by) queryParts.push(`order_by=${params.order_by}`);

      // Add vc_ids without []
      if (activeFilters.vc_ids?.length) {
        activeFilters.vc_ids.forEach((vc: { id: number }) => {
          queryParts.push(`vc_ids=${vc.id}`);
        });
      }

      // Add repo_ids without []
      if (activeFilters.repo_ids?.length) {
        activeFilters.repo_ids.forEach((repo: { id: number }) => {
          queryParts.push(`repo_ids=${repo.id}`);
        });
      }

      // Construct final URL with query string
      const finalUrl = `${apiUrl}?${queryParts.join('&')}`;

      commonAPIRequest<PaginatedResponse>(
        {
          api: finalUrl,
          method: endpoint.method,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setAllowList(response);
          }
        }
      );
    },
    [commonAPIRequest, activeFilters]
  );

  const updateParams = useCallback(
    (updates: Partial<QueryParams>) => {
      setSearchParams((prev) => {
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            prev.set(key, value.toString());
          } else {
            prev.delete(key);
          }
        });
        return prev;
      });
    },
    [setSearchParams]
  );

  const debouncedSearch = debounce((term: string) => {
    updateParams({
      search: term || undefined,
      page: 1,
    });
  }, 300);

  const handleOrderChange = useCallback(() => {
    const currentDirection = searchParams.get('order_by') || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    updateParams({ order_by: newDirection, page: 1 });
  }, [searchParams, updateParams]);

  const handleSortByChange = useCallback(
    (field: QueryParams['sort_by']) => {
      const currentSortBy = searchParams.get('sort_by');
      const currentOrderBy = searchParams.get('order_by') || 'asc';

      updateParams({
        sort_by: field,
        order_by: currentSortBy === field ? (currentOrderBy === 'asc' ? 'desc' : 'asc') : 'asc',
        page: 1,
      });
    },
    [searchParams, updateParams]
  );

  const handleFiltersChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
    updateParams({ page: 1 });
  };

  const handleSuccess = () => {
    fetchAllowList({
      page,
      limit,
      search,
      order_by,
      sort_by,
    });
  };

  React.useEffect(() => {
    fetchAllowList({
      page,
      limit,
      search,
      order_by,
      sort_by,
    });
  }, [page, limit, search, order_by, sort_by, activeFilters]);

  return (
    <QueryClientProvider client={queryClient}>
      <Card className="w-full border-none">
        <CardContent className="p-0 border-none shadow-none">
          <div className="flex items-center justify-between gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allow list..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>
            <div className="flex gap-2">
              <AllowlistFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={activeFilters}
              />
              <Button
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 dark:from-emerald-600 dark:to-blue-600 dark:hover:from-emerald-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg"
                onClick={() => setDialogOpen(true)}
                variant="default"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Incident
              </Button>
              <Button
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 dark:from-emerald-600 dark:to-blue-600 dark:hover:from-emerald-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg"
                onClick={() => setAssetAllowlistDialogOpen(true)}
                variant="default"
              >
                Assets Allowlist
              </Button>
            </div>

            <ViewAssetAllowlistDialog
              open={assetAllowlistDialogOpen}
              onOpenChange={setAssetAllowlistDialogOpen}
              // commonAPIRequest={commonAPIRequest}
              // onSuccess={handleSuccess}
            />

            <AddAllowListDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              commonAPIRequest={commonAPIRequest}
              onSuccess={handleSuccess}
            />
          </div>

          <AllowListTable
            isLoading={isLoading}
            allowList={allowList?.data || []}
            limit={limit}
            handleOrderChange={handleOrderChange}
            handleSortByChange={handleSortByChange}
            fetchAllowLists={() =>
              fetchAllowList({
                page,
                limit,
                search,
                order_by,
                sort_by,
              })
            }
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Select
                value={limit.toString()}
                onValueChange={(value) => updateParams({ limit: Number(value), page: 1 })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                {((allowList?.current_page || 1) - 1) * (allowList?.current_limit || 10) + 1} to{' '}
                {Math.min(
                  (allowList?.current_page || 1) * (allowList?.current_limit || 10),
                  allowList?.total_count || 0
                )}{' '}
                of {allowList?.total_count || 0}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: 1 })}
                disabled={page === 1}
                className="w-8"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: page - 1 })}
                disabled={page === 1}
                className="w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers(page, allowList?.total_pages || 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ page: pageNum })}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: page + 1 })}
                disabled={page === (allowList?.total_pages || 1)}
                className="w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: allowList?.total_pages || 1 })}
                disabled={page === (allowList?.total_pages || 1)}
                className="w-8"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </QueryClientProvider>
  );
};

const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const range: number[] = [];
  const maxPages = Math.min(5, totalPages);
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxPages - 1);

  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1);
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
};

export default withAPIRequest(AllowListTab);
