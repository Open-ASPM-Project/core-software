import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Clock,
  Filter,
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

import IncidentsTable from './IncidentsTable';
import { IncidentFilters } from '../components/IncidentsFilters';

interface Incident {
  id: number;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  secret: {
    file: string;
    rule: string;
    severity: string;
    description: string;
    author: string;
    email: string;
    commit: string;
    date: string;
  };
  repository: {
    id: number;
    name: string;
    repoUrl: string;
    author: string;
  };
}

interface PaginatedResponse {
  data: Incident[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: string;
  // Add all possible filter fields
  severity?: string;
  type?: string;
  repo_ids?: string[];
  vc_ids?: string[];
  pr_ids?: string[];
  group_ids?: string[];
  rule?: string;
  commit?: string;
  author?: string;
  email?: string;
  description?: string;
  scan_type?: string;
  whitelisted?: boolean;
  message?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
}

interface IncidentsTabProps {
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

interface StatItem {
  label: string;
  value: string;
  count: number;
}

const IncidentsTab: React.FC<IncidentsTabProps> = ({ commonAPIRequest }) => {
  const queryClient = new QueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [incidents, setIncidents] = useState<PaginatedResponse | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';
  const order_by = (searchParams.get('order_by') as 'asc' | 'desc') || 'desc';
  const sort_by = searchParams.get('sort_by') || 'created_at';
  const severity = searchParams.get('severity') || '';
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string[]>>({});
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const fetchStats = useCallback(() => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.incidents.getStats; // Add this endpoint in your config
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<StatItem[]>(
      {
        api: apiUrl,
        method: 'GET',
        params: {
          incident_type: 'secret',
        },
      },
      (response) => {
        if (response) {
          setStatsData(response);
        }
      }
    );
  }, [commonAPIRequest]);

  const fetchIncidents = useCallback(
    (params: QueryParams) => {
      if (!commonAPIRequest) return;
      setIsLoading(true);

      const endpoint = API_ENDPOINTS.incidents.getIncidents;
      const apiUrl = createEndpointUrl(endpoint);

      // Construct the request data object
      const requestData: any = {
        page: params.page,
        limit: params.limit,
        sort_by: params.sort_by,
        order_by: params.order_by,
        incident_type: 'secret',
      };

      // Add search if present
      if (params.search) {
        requestData.search = params.search;
      }

      // Add severity filter
      if (activeFilters.severities?.length) {
        requestData.severities = activeFilters.severities.map((item) => item.value);
      }

      // // Add scan type filter
      // if (activeFilters.scan_type?.value) {
      //   queryParts.push(`scan_type=${activeFilters.scan_type.value}`);
      // }

      // // Add secret filter
      // if (activeFilters.secret?.value) {
      //   queryParts.push(`secret=${activeFilters.secret.value}`);
      // }

      // // Add email filter
      if (activeFilters.emails?.length) {
        requestData.emails = activeFilters.emails.map((item) => item.value);
      }

      // // Add description filter
      if (activeFilters.descriptions?.length) {
        requestData.descriptions = activeFilters.descriptions.map((item) => item.value);
      }

      // // Add pr_scan_id filter
      // if (activeFilters.pr_scan_id?.value) {
      //   queryParts.push(`pr_scan_id=${activeFilters.pr_scan_id.value}`);
      // }

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

      // // Add Secrets filter
      if (activeFilters.secrets?.length) {
        requestData.secrets = activeFilters.secrets.map((item) => item.value);
      }

      if (activeFilters.whitelisted) {
        requestData.whitelisted = activeFilters.whitelisted === 'true' ? true : false;
      }

      // Add version control filter
      if (activeFilters.vc_ids?.length) {
        requestData.vc_ids = activeFilters.vc_ids.map((vc: any) => vc.id);
      }

      // Add repository filter
      if (activeFilters.repo_ids?.length) {
        requestData.repo_ids = activeFilters.repo_ids.map((repo: any) => repo.id);
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
      if (activeFilters.created_after) {
        requestData.created_after = activeFilters.created_after;
      }
      if (activeFilters.created_before) {
        requestData.created_before = activeFilters.created_before;
      }
      if (activeFilters.updated_after) {
        requestData.updated_after = activeFilters.updated_after;
      }
      if (activeFilters.updated_before) {
        requestData.updated_before = activeFilters.updated_before;
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
            setIncidents(response);
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
    updateParams({ search: term || undefined, page: 1 });
  }, 300);

  const handleSortByChange = useCallback(
    (field: string) => {
      const currentSortBy = searchParams.get('sort_by');
      const currentOrderBy = searchParams.get('order_by') || 'desc';

      if (field === currentSortBy) {
        updateParams({
          sort_by: field,
          order_by: currentOrderBy === 'asc' ? 'desc' : 'asc',
          page: 1,
        });
      } else {
        updateParams({
          sort_by: field,
          order_by: 'desc',
          page: 1,
        });
      }
    },
    [searchParams, updateParams]
  );

  const handleStatCardClick = (severity: string) => {
    // Convert severity to lowercase to match the filter format
    const severityValue = severity.toLowerCase();

    setActiveFilters((prev) => {
      // If severities array doesn't exist or doesn't include this severity, add it
      if (!prev.severities?.some((s) => s.value === severityValue)) {
        return {
          ...prev,
          severities: [...(prev.severities || []), { value: severityValue, label: severity }],
        };
      }
      // If severity is already selected, remove it
      return {
        ...prev,
        severities: prev.severities.filter((s) => s.value !== severityValue),
      };
    });

    // Reset to first page when filter changes
    updateParams({ page: 1 });
  };

  const getStats = () => {
    if (!incidents) return null;
    return {
      critical: incidents.data.filter((i) => i.secret.severity === 'critical').length,
      high: incidents.data.filter((i) => i.secret.severity === 'high').length,
      medium: incidents.data.filter((i) => i.secret.severity === 'medium').length,
      low: incidents.data.filter((i) => i.secret.severity === 'low').length,
    };
  };

  const stats = getStats();

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters: Record<string, any> = {};
    const hasFilterParams = [
      'secrets',
      'commits',
      'scan_type',
      'repo_ids',
      'pr_ids',
      'pr_scan_id',
    ].some((param) => urlParams.has(param));

    if (hasFilterParams) {
      // Let the IncidentFilters component handle the URL params
      setInitialLoad(false);
      // Handle scan_type
      if (urlParams.get('scan_type')) {
        urlFilters.scan_type = {
          value: urlParams.get('scan_type'),
          label: urlParams.get('scan_type')?.toUpperCase().replace('_', ' '),
        };
      }

      if (urlParams.get('commits')) {
        const commits = urlParams.get('commits')?.split(',');
        urlFilters.commits = commits?.map((commit) => ({
          value: commit,
          label: commit,
        }));
      }

      // Handle secret

      if (urlParams.get('secrets')) {
        const secrets = urlParams.get('secrets')?.split(',');
        urlFilters.secrets = secrets?.map((secret) => ({
          value: secret,
          label: secret,
        }));
      }

      // Add pr_scan_id handler
      if (urlParams.get('pr_scan_id')) {
        urlFilters.pr_scan_id = {
          value: urlParams.get('pr_scan_id'),
          label: urlParams.get('pr_scan_id'),
        };
      }

      // Handle repo_id
      if (urlParams.get('repo_ids')) {
        urlFilters.repo_ids = [{ id: parseInt(urlParams.get('repo_ids')!) }];
      }

      // Handle pr_id
      if (urlParams.get('pr_ids')) {
        urlFilters.pr_ids = [{ id: parseInt(urlParams.get('pr_ids')!) }];
      }

      // Set initial active filters if URL params exist
      if (Object.keys(urlFilters).length > 0) {
        setActiveFilters((prev) => ({ ...prev, ...urlFilters }));
        setInitialLoad(false);
      }
    } else {
      fetchIncidents({
        page,
        limit,
        search,
        order_by,
        sort_by,
        severity,
      });
      setInitialLoad(false);
    }
  }, []);

  console.log('filters', activeFilters);

  React.useEffect(() => {
    if (!initialLoad) {
      fetchIncidents({
        page,
        limit,
        search,
        order_by,
        sort_by,
        severity,
      });
    }
  }, [page, limit, search, order_by, sort_by, severity, activeFilters, initialLoad]);

  React.useEffect(() => {
    fetchStats();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Card className="w-full border-none">
        <CardContent className="p-0 space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            {statsData.map((stat) => {
              const config = {
                CRITICAL: {
                  bgClass: 'from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20',
                  iconBg: 'bg-red-100 dark:bg-red-900/50',
                  textColor: 'text-red-600 dark:text-red-400',
                  titleColor: 'text-red-700 dark:text-red-300',
                  icon: <AlertTriangle className="h-5 w-5" />,
                },
                HIGH: {
                  bgClass:
                    'from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20',
                  iconBg: 'bg-orange-100 dark:bg-orange-900/50',
                  textColor: 'text-orange-600 dark:text-orange-400',
                  titleColor: 'text-orange-700 dark:text-orange-300',
                  icon: <Shield className="h-5 w-5" />,
                },
                MEDIUM: {
                  bgClass:
                    'from-yellow-50 to-yellow-100/50 dark:from-yellow-950/50 dark:to-yellow-900/20',
                  iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
                  textColor: 'text-yellow-600 dark:text-yellow-400',
                  titleColor: 'text-yellow-700 dark:text-yellow-300',
                  icon: <Clock className="h-5 w-5" />,
                },
                LOW: {
                  bgClass:
                    'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/20',
                  iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
                  textColor: 'text-emerald-600 dark:text-emerald-400',
                  titleColor: 'text-emerald-700 dark:text-emerald-300',
                  icon: <Shield className="h-5 w-5" />,
                },
              };

              const style = config[stat.value as keyof typeof config];
              const isSelected = activeFilters.severities?.some(
                (s) => s.value.toLowerCase() === stat.value.toLowerCase()
              );

              return (
                <div
                  key={stat.value}
                  className={`p-4 rounded-lg border bg-gradient-to-br ${style.bgClass} cursor-pointer 
        transition-transform duration-200 hover:scale-105 
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => handleStatCardClick(stat.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleStatCardClick(stat.value);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${style.iconBg}`}>
                      <div className={style.textColor}>{style.icon}</div>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${style.textColor}`}>{stat.label}</p>
                      <h3 className={`text-2xl font-bold ${style.titleColor}`}>{stat.count}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-8"
              />
              {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
            </div>

            <IncidentFilters
              onFiltersChange={(filters) => {
                setActiveFilters(filters);
                updateParams({ page: 1 });
              }}
              initialFilters={activeFilters}
              commonAPIRequest={commonAPIRequest}
            />
          </div>

          {/* Table */}
          <IncidentsTable
            incidents={incidents?.data || []}
            isLoading={isLoading}
            limit={limit}
            handleOrderChange={() =>
              updateParams({ order_by: order_by === 'asc' ? 'desc' : 'asc' })
            }
            onSuccess={() =>
              fetchIncidents({
                page,
                limit,
                search,
                order_by,
                sort_by,
                severity,
              })
            }
            handleSortByChange={handleSortByChange}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
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
                {((incidents?.current_page || 1) - 1) * (incidents?.current_limit || 10) + 1} to{' '}
                {Math.min(
                  (incidents?.current_page || 1) * (incidents?.current_limit || 10),
                  incidents?.total_count || 0
                )}{' '}
                of {incidents?.total_count || 0}
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

              {getPageNumbers(page, incidents?.total_pages || 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ page: pageNum })}
                  className={`w-8 ${
                    pageNum === page ? 'bg-gradient-to-r from-violet-600 to-blue-600' : ''
                  }`}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: page + 1 })}
                disabled={page === (incidents?.total_pages || 1)}
                className="w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: incidents?.total_pages || 1 })}
                disabled={page === (incidents?.total_pages || 1)}
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

export default withAPIRequest(IncidentsTab);
