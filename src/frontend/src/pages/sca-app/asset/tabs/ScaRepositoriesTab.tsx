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
import { ScaRepositoryFilters } from '../components/repository/ScaRepositoryFilters';
import ScaRepoTable from '../components/repository/ScaRepoTable';

// Types

interface Repository {
  repoUrl: string | undefined;
  secrets_count: number;
  author: string;
  score_normalized: number;
  id: number;
  name: string;
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  data: Repository[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'secrets_count' | 'created_at' | 'score_normalized';
  created_after?: string;
  created_before?: string;
  author?: string;
  vc_ids?: number[];
  repo_ids?: number[];
}

interface RepoTableProps {
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

const ScaRepositoriesTab: React.FC<RepoTableProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [repositories, setRepositories] = React.useState<PaginatedResponse | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'vulnerability_count';

  // Fetch repositories
  const fetchRepositories = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.repository.getRepository;
      const apiUrl = createEndpointUrl(endpoint);

      const queryParts: string[] = [`page=${params.page}`, `limit=${params.limit}`];

      if (params.search) queryParts.push(`search=${params.search}`);
      if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`);
      if (params.order_by) queryParts.push(`order_by=${params.order_by}`);

      // Handle repo_ids
      if (activeFilters.repo_ids?.length) {
        activeFilters.repo_ids.forEach((repo) => {
          queryParts.push(`repo_ids=${repo.id}`);
        });
      }

      // Handle vc_ids
      if (activeFilters.vc_ids?.length) {
        activeFilters.vc_ids.forEach((vc) => {
          queryParts.push(`vc_ids=${vc.id}`);
        });
      }

      // Handle author
      if (activeFilters.author?.value) {
        queryParts.push(`author=${activeFilters.author.value}`);
      }

      // Handle created_after and created_before dates
      if (activeFilters.created_after) {
        queryParts.push(`created_after=${activeFilters.created_after}`);
      }
      if (activeFilters.created_before) {
        queryParts.push(`created_before=${activeFilters.created_before}`);
      }

      const finalUrl = `${apiUrl}?${queryParts.join('&')}`;

      commonAPIRequest<PaginatedResponse>(
        {
          api: finalUrl,
          method: endpoint.method,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setRepositories(response);
          }
        }
      );
    },
    [commonAPIRequest, activeFilters]
  );

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

  // Handle order change from RepoTable
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

      // If clicking the same field, toggle the order
      if (field === currentSortBy) {
        updateParams({
          sort_by: field,
          order_by: currentOrderBy === 'asc' ? 'desc' : 'asc',
          page: 1,
        });
      } else {
        // If clicking a new field, set it with default 'asc' order
        updateParams({
          sort_by: field || undefined,
          order_by: 'asc',
          page: 1,
        });
      }
    },
    [searchParams, updateParams]
  );

  // Handle filter changes
  const handleFiltersChange = (filters: Record<string, any>) => {
    // Convert dates to ISO strings if they exist
    const formattedFilters = {
      ...filters,
      created_after:
        filters.created_after instanceof Date
          ? filters.created_after.toISOString()
          : filters.created_after,
      created_before:
        filters.created_before instanceof Date
          ? filters.created_before.toISOString()
          : filters.created_before,
    };

    setActiveFilters(formattedFilters);
    updateParams({ page: 1 });
  };

  // Fetch data when params change
  React.useEffect(() => {
    fetchRepositories({
      page,
      limit,
      search,
      order_by,
      sort_by,
    });
  }, [page, limit, search, order_by, sort_by, activeFilters]);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Card className="w-full border-none">
          <CardContent className="p-0 border-none shadow-none">
            {/* Search Section */}
            <div className="flex items-center justify-between gap-4 mb-6 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  defaultValue={search}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-8"
                />
                {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
              </div>
              <ScaRepositoryFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={activeFilters}
              />
            </div>
            {/* table */}
            <ScaRepoTable
              isLoading={isLoading}
              repositories={repositories?.data || []}
              limit={limit}
              handleOrderChange={handleOrderChange}
              handleSortByChange={handleSortByChange}
              commonAPIRequest={commonAPIRequest}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => updateParams({ limit: Number(value), page: 1 })}
                >
                  <SelectTrigger className="w-[120px] hover:border-violet-400 focus:ring-violet-400 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((size) => (
                      <SelectItem
                        key={size}
                        value={size.toString()}
                        className="hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20"
                      >
                        {size} per page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Showing{' '}
                  {((repositories?.current_page || 1) - 1) * (repositories?.current_limit || 10) +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    (repositories?.current_page || 1) * (repositories?.current_limit || 10),
                    repositories?.total_count || 0
                  )}{' '}
                  of {repositories?.total_count || 0}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: 1 })}
                  disabled={page === 1}
                  className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: page - 1 })}
                  disabled={page === 1}
                  className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(page, repositories?.total_pages || 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateParams({ page: pageNum })}
                    className={`w-8 transition-all duration-200 ${
                      pageNum === page
                        ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-none'
                        : 'hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 hover:border-violet-400 dark:hover:border-violet-600'
                    }`}
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: page + 1 })}
                  disabled={page === (repositories?.total_pages || 1)}
                  className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: repositories?.total_pages || 1 })}
                  disabled={page === (repositories?.total_pages || 1)}
                  className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </QueryClientProvider>
    </>
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

export default withAPIRequest(ScaRepositoriesTab);
