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
  PlusCircle,
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
import GroupTable from '../components/groups/GroupTable';
import AddGroupDialog from '../dialogs/groups/AddGroupDialog';
import { GroupFilters } from '../components/groups/GroupFilters';

// Types
interface Group {
  id: number;
  name: string;
  description: string;
  active: boolean;
  repo_count: number;
  created_on: string;
  created_by: number | string;
  updated_by: number | string;
  score_normalized: number;
  score_normalized_on: string;
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  data: Group[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'repo_count' | 'created_at' | 'score';
}

interface GroupTableProps {
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

const GroupsTab: React.FC<GroupTableProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [groups, setGroups] = React.useState<PaginatedResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'created_at';

  // Fetch groups
  const fetchGroups = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.group.getGroups;
      const apiUrl = createEndpointUrl(endpoint);

      // Create query string
      const queryParts: string[] = [`page=${params.page}`, `limit=${params.limit}`];

      if (params.search) queryParts.push(`search=${params.search}`);
      if (params.sort_by) queryParts.push(`sort_by=${params.sort_by}`);
      if (params.order_by) queryParts.push(`order_by=${params.order_by}`);

      // Add repo_ids from filters
      if (activeFilters.repo_ids?.length) {
        activeFilters.repo_ids.forEach((repo) => {
          queryParts.push(`repo_ids=${repo.id}`);
        });
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
            setGroups(response);
          }
        }
      );
    },
    [commonAPIRequest, activeFilters] // Add activeFilters to dependencies
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

  // Handle order change from GroupTable
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

  const handleFiltersChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
    // Reset to first page when filters change
    updateParams({ page: 1 });
  };

  const handleGroupRefresh = () => {
    // Refresh the groups list
    fetchGroups({
      page,
      limit,
      search,
      order_by,
      sort_by,
    });
  };

  // Fetch data when params change
  React.useEffect(() => {
    if (searchParams.get('tab') === 'groups') {
      fetchGroups({
        page,
        limit,
        search,
        order_by,
        sort_by,
      });
    }
  }, [page, limit, search, order_by, sort_by, searchParams]);

  return (
    <QueryClientProvider client={queryClient}>
      <Card className="w-full border-none">
        <CardContent className="p-0 border-none shadow-none">
          {/* Search Section */}
          <div className="flex items-center justify-between gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>

            {/* Add GroupFilters here */}
            <GroupFilters onFiltersChange={handleFiltersChange} initialFilters={activeFilters} />

            {/* Add Group Button */}
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Group</span>
              <span className="inline sm:hidden">Add</span>
            </Button>

            <AddGroupDialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onSuccess={handleGroupRefresh}
              commonAPIRequest={commonAPIRequest}
            />
          </div>

          {/* Table */}
          <GroupTable
            isLoading={isLoading}
            groups={groups?.data || []}
            limit={limit}
            handleOrderChange={handleOrderChange}
            handleSortByChange={handleSortByChange}
            onSuccess={handleGroupRefresh}
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
                Showing {((groups?.current_page || 1) - 1) * (groups?.current_limit || 10) + 1} to{' '}
                {Math.min(
                  (groups?.current_page || 1) * (groups?.current_limit || 10),
                  groups?.total_count || 0
                )}{' '}
                of {groups?.total_count || 0}
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

              {getPageNumbers(page, groups?.total_pages || 1).map((pageNum) => (
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
                disabled={page === (groups?.total_pages || 1)}
                className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: groups?.total_pages || 1 })}
                disabled={page === (groups?.total_pages || 1)}
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

export default withAPIRequest(GroupsTab);
