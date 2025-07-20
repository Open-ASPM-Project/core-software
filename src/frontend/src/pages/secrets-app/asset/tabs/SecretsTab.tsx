import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Filter,
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
import SecretTable from '../components/secrets/SecretsTable';
import { SecretFilters } from '../components/secrets/SecretFilters';
// import { SecretFilters } from '../components/secret/SecretFilters';

// Types
interface Secret {
  id: number;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  repository: string;
  created_at: string;
  status: 'active' | 'resolved' | 'false_positive';
  type: string;
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  secrets: Secret[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'severity' | 'created_at' | 'status';
}

interface SecretTableProps {
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
      secrets?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const SecretsTab: React.FC<SecretTableProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [secrets, setSecrets] = React.useState<PaginatedResponse | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'repo_count';

  // Fetch secrets
  const fetchSecrets = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.secrets.getSecrets;
      const apiUrl = createEndpointUrl(endpoint);

      // Construct the request data object
      const requestData: any = {
        page: params.page,
        limit: params.limit,
        sort_by: params.sort_by,
        order_by: params.order_by,
      };

      // Add search if present
      if (params.search) {
        requestData.search = params.search;
      }

      if (activeFilters.severities?.length) {
        requestData.severities = activeFilters.severities.map((item) => item.value);
      }

      // // Add description filter
      if (activeFilters.descriptions?.length) {
        requestData.descriptions = activeFilters.descriptions.map((item) => item.value);
      }

      // // Add message filter
      if (activeFilters.messages?.length) {
        requestData.messages = activeFilters.messages.map((item) => item.value);
      }

      // // Add rule filter
      if (activeFilters.rules?.length) {
        requestData.rules = activeFilters.rules.map((item) => item.value);
      }

      // // Add commit filter
      if (activeFilters.commits?.length) {
        requestData.commits = activeFilters.commits.map((item) => item.value);
      }

      // Add repository filter
      if (activeFilters.repo_ids?.length) {
        requestData.repo_ids = activeFilters.repo_ids.map((repo: any) => repo.id);
      }

      // Add repository filter
      if (activeFilters.vc_ids?.length) {
        requestData.vc_ids = activeFilters.vc_ids.map((vc: any) => vc.id);
      }

      // Add pull request filter
      if (activeFilters.pr_ids?.length) {
        requestData.pr_ids = activeFilters.pr_ids.map((pr: any) => pr.id);
      }

      // Add group filter
      if (activeFilters.group_ids?.length) {
        requestData.group_ids = activeFilters.group_ids.map((group: any) => group.id);
      }

      // Add author filter
      if (activeFilters.authors?.length) {
        requestData.authors = activeFilters.authors.map((item) => item.value);
      }

      // Date filters
      if (activeFilters.created_at) {
        requestData.created_at = activeFilters.created_at;
      }
      if (activeFilters.updated_at) {
        requestData.updated_at = activeFilters.updated_at;
      }

      commonAPIRequest<PaginatedResponse>(
        {
          api: apiUrl,
          method: endpoint.method,
          data: requestData,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setSecrets(response);
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

  // Handle order change from SecretTable
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
          sort_by: field || undefined,
          order_by: 'asc',
          page: 1,
        });
      }
    },
    [searchParams, updateParams]
  );

  // Handle filter changes
  const handleFiltersChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
    updateParams({ page: 1 });
  };

  // Fetch secrets when params change
  React.useEffect(() => {
    if (searchParams.get('tab') === 'secrets') {
      fetchSecrets({
        page,
        limit,
        search,
        order_by,
        sort_by,
      });
    }
  }, [page, limit, search, order_by, sort_by, activeFilters, searchParams]);

  console.log('activeFilters', activeFilters);
  return (
    <QueryClientProvider client={queryClient}>
      <Card className="w-full border-none">
        <CardContent className="p-0 border-none shadow-none">
          {/* Search Section */}
          <div className="flex items-center justify-between gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search secrets..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>
            <SecretFilters onFiltersChange={handleFiltersChange} initialFilters={activeFilters} />
          </div>

          {/* Table */}
          <SecretTable
            isLoading={isLoading}
            secrets={secrets?.secrets || []}
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
                Showing {((secrets?.current_page || 1) - 1) * (secrets?.current_limit || 10) + 1} to{' '}
                {Math.min(
                  (secrets?.current_page || 1) * (secrets?.current_limit || 10),
                  secrets?.total_count || 0
                )}{' '}
                of {secrets?.total_count || 0}
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

              {getPageNumbers(page, secrets?.total_pages || 1).map((pageNum) => (
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
                disabled={page === (secrets?.total_pages || 1)}
                className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: secrets?.total_pages || 1 })}
                disabled={page === (secrets?.total_pages || 1)}
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

export default withAPIRequest(SecretsTab);
