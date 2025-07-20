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

import VulnerabilitiesTable from '../../components/vulnerabilities/VulnerabilitiesTable';
import { VulnerabilityFilters } from '../../components/vulnerabilities/VulnerabilityFilters';

// Types
interface CVSSMetrics {
  baseScore: number;
  exploitabilityScore: number;
  impactScore: number;
}

interface Vulnerability {
  id: number;
  vulnerability_id: string;
  cve_id: string;
  package: string;
  package_version: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  artifact_type: string;
  artifact_path: string;
  cvss_base_score: number;
  cvss_exploitability_score: number;
  cvss_impact_score: number;
  vulnerability_type: string;
  vulnerability_data_source: string;
  fix_available: boolean;
  created_at: string;
  updated_at: string;
  repository_id: number;
  whitelisted: boolean;
  all_details: {
    vulnerability: {
      id: string;
      severity: string;
      description: string;
      fix: {
        versions: string[];
        state: string;
      };
    };
    artifact: {
      name: string;
      version: string;
      type: string;
      language: string;
    };
  };
}

interface PaginatedResponse {
  current_limit: number;
  current_page: number;
  vulnerabilities: Vulnerability[];
  total_count: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'severity' | 'cvss_base_score' | 'created_at' | 'package';
}

interface VulnerabilityTableProps {
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const ScaVulnerabilitiesTab: React.FC<VulnerabilityTableProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [vulnerabilities, setVulnerabilities] = React.useState<PaginatedResponse | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = (searchParams.get('sort_by') as QueryParams['sort_by']) || 'repo_count';

  // Fetch vulnerabilities
  const fetchVulnerabilities = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.vulnerabilities.getUniqueVulnerabilities;
      const apiUrl = createEndpointUrl(endpoint);

      // Construct the request body
      const requestData: any = {
        limit: params.limit,
        page: params.page,
        sort_by: params.sort_by,
        order_by: params.order_by,
      };

      // Add search if present
      if (params.search) {
        requestData.search = params.search;
      }

      // Add filters
      if (activeFilters.severity?.value) {
        requestData.severities = [activeFilters.severity.value];
      }

      if (activeFilters.fix_available !== undefined) {
        requestData.fix_available = activeFilters.fix_available;
      }

      if (activeFilters.artifact_types?.length) {
        requestData.artifact_types = activeFilters.artifact_types.map((item) => item.value);
      }

      if (activeFilters.cve_ids?.length) {
        requestData.cve_ids = activeFilters.cve_ids.map((item) => item.value);
      }

      if (activeFilters.packages?.length) {
        requestData.packages = activeFilters.packages.map((item) => item.value);
      }

      if (activeFilters.licenses?.length) {
        requestData.licenses = activeFilters.licenses.map((item) => item.value);
      }

      if (activeFilters.repo_ids?.length) {
        requestData.repo_ids = activeFilters.repo_ids.map((item) => item.id);
      }

      if (activeFilters.live_commit_ids?.length) {
        requestData.live_commit_ids = activeFilters.live_commit_ids.map((item) => item.id);
      }

      if (activeFilters.vc_ids?.length) {
        requestData.vc_ids = activeFilters.vc_ids.map((item) => item.id);
      }

      if (activeFilters.pr_ids?.length) {
        requestData.pr_ids = activeFilters.pr_ids.map((item) => item.id);
      }

      if (activeFilters.created_after) {
        requestData.created_after = activeFilters.created_after;
      }

      if (activeFilters.created_before) {
        requestData.created_before = activeFilters.created_before;
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
            setVulnerabilities(response);
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

  // Fetch vulnerabilities when params change
  React.useEffect(() => {
    fetchVulnerabilities({
      page,
      limit,
      search,
      order_by,
      sort_by,
    });
  }, [page, limit, search, order_by, sort_by, activeFilters]);

  console.log('active-filters', activeFilters);

  return (
    <QueryClientProvider client={queryClient}>
      <Card className="w-full border-none">
        <CardContent className="p-0 border-none shadow-none">
          {/* Search Section */}
          <div className="flex items-center justify-between gap-4 mb-6 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vulnerabilities by CVE ID, or description..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>
            <VulnerabilityFilters
              onFiltersChange={handleFiltersChange}
              initialFilters={activeFilters}
            />
          </div>

          {/* Table */}
          <VulnerabilitiesTable
            isLoading={isLoading}
            vulnerabilities={vulnerabilities?.data || []}
            limit={limit}
            handleOrderChange={handleOrderChange}
            handleSortByChange={handleSortByChange}
          />

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
                {((vulnerabilities?.current_page || 1) - 1) *
                  (vulnerabilities?.current_limit || 10) +
                  1}{' '}
                to{' '}
                {Math.min(
                  (vulnerabilities?.current_page || 1) * (vulnerabilities?.current_limit || 10),
                  vulnerabilities?.total_count || 0
                )}{' '}
                of {vulnerabilities?.total_count || 0}
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

              {getPageNumbers(page, vulnerabilities?.total_pages || 1).map((pageNum) => (
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
                disabled={page === (vulnerabilities?.total_pages || 1)}
                className="w-8 hover:bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 
                hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: vulnerabilities?.total_pages || 1 })}
                disabled={page === (vulnerabilities?.total_pages || 1)}
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

export default withAPIRequest(ScaVulnerabilitiesTab);
