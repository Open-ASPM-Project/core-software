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
import CommitScansTable from '../table/commit-scans/CommitScansTable';
import { CommitScansFilters } from '../components/commit-scans/CommitScansFilters';

// Types
interface Commit {
  commit_id: string;
  commit_message: string;
  repo_id: number;
  commit_link: string;
  author: string;
  committed_date: string;
}

interface CommitScan {
  commit_id: string;
  vc_id: number;
  webhook_id: number;
  repo_id: number;
  vc_type: string;
  status: string;
  block_status: boolean;
  scan_type: string;
  id: number;
  created_at: string;
  commit: Commit;
  vc_name: string;
  repo_name: string;
  secret_count: number;
  vulnerability_count: number;
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  data: CommitScan[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'vc_name' | 'repo_name' | 'secret_count' | 'vulnerability_count' | 'created_at';
}

interface CommitScansTabProps {
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

const CommitScansTab: React.FC<CommitScansTabProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [commitScans, setCommitScans] = React.useState<PaginatedResponse | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'created_at';

  // Fetch Commit Scans
  const fetchCommitScans = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.commitScans.getCommitScans;
      const apiUrl = createEndpointUrl(endpoint);

      // Create query string manually
      const queryParts: string[] = [
        `page=${params.page}`,
        `limit=${params.limit}`,
        `scan_type=SECRET`,
      ];

      if (params.search) queryParts.push(`search=${params.search}`);
      if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`);
      if (params.order_by) queryParts.push(`order_by=${params.order_by}`);

      // Add vc_ids without []
      if (activeFilters.vc_ids?.length) {
        activeFilters.vc_ids.forEach((vc) => {
          queryParts.push(`vc_ids=${vc.id}`);
        });
      }

      // Add repo_ids without []
      if (activeFilters.repo_ids?.length) {
        activeFilters.repo_ids.forEach((repo) => {
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
            setCommitScans(response);
          }
        }
      );
    },
    [commonAPIRequest, activeFilters]
  );

  const handleFiltersChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
    // Reset to first page when filters change
    updateParams({ page: 1 });
  };

  // Update search params
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

  // Debounced search
  const debouncedSearch = debounce((term: string) => {
    updateParams({
      search: term || undefined,
      page: 1,
    });
  }, 300);

  // Handle order change
  const handleOrderChange = useCallback(() => {
    const currentDirection = searchParams.get('order_by') || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

    updateParams({
      order_by: newDirection,
      page: 1,
    });
  }, [searchParams, updateParams]);

  // Handle sort field change
  const handleSortByChange = useCallback(
    (field: QueryParams['sort_by']) => {
      const currentSortBy = searchParams.get('sort_by');
      const currentOrderBy = searchParams.get('order_by') || 'asc';

      if (field === currentSortBy) {
        updateParams({
          sort_by: field,
          order_by: currentOrderBy === 'asc' ? 'desc' : 'asc',
          page: 1,
        });
      } else {
        updateParams({
          sort_by: field,
          order_by: 'asc',
          page: 1,
        });
      }
    },
    [searchParams, updateParams]
  );

  // Fetch data when params change
  React.useEffect(() => {
    fetchCommitScans({
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
          {/* Search Section */}
          <div className="flex items-center justify-between gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commit scans..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>
            <CommitScansFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={activeFilters}
            />
          </div>

          {/* Commit Scans Table */}
          <CommitScansTable
            isLoading={isLoading}
            commitScans={commitScans?.data || []}
            limit={limit}
            handleOrderChange={handleOrderChange}
            handleSortByChange={handleSortByChange}
          />

          {/* Pagination */}
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
                {((commitScans?.current_page || 1) - 1) * (commitScans?.current_limit || 10) + 1} to{' '}
                {Math.min(
                  (commitScans?.current_page || 1) * (commitScans?.current_limit || 10),
                  commitScans?.total_count || 0
                )}{' '}
                of {commitScans?.total_count || 0}
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

              {getPageNumbers(page, commitScans?.total_pages || 1).map((pageNum) => (
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
                disabled={page === (commitScans?.total_pages || 1)}
                className="w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: commitScans?.total_pages || 1 })}
                disabled={page === (commitScans?.total_pages || 1)}
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

// Utility function for pagination
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

export default withAPIRequest(CommitScansTab);
