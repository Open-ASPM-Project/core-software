import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  EyeOpenIcon,
  MixerHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LockIcon, KeyRoundIcon, BugIcon } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import {
  FileDownIcon,
  SlidersHorizontalIcon,
  RefreshCwIcon,
  LayersIcon,
  GitForkIcon,
  AlertTriangleIcon,
  FileTextIcon,
  CircleDotIcon,
  CalendarIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
// Types
type IncidentType = 'secret' | 'vulnerability';

interface Vulnerability {
  cve_data_source: string;
  package: string;
  severity: string;
  package_version: string;
  description: string;
  cvss_base_score: number;
  repository: Repository;
}

interface Repository {
  id: number;
  repoUrl: string;
  name: string;
  full_name: string;
  author: string;
}

interface Secret {
  severity: string;
  description: string;
  file: string;
  line: string;
  author: string;
  date: string;
}

interface Incident {
  id: number;
  status: string;
  type: IncidentType;
  created_at: string;
  updated_at: string;
  vulnerability: Vulnerability | null;
  repository: Repository | null;
  secret?: Secret | null;
}

interface PaginationInfo {
  current_limit: number;
  current_page: number;
  total_count: number;
  total_pages: number;
}

interface APIResponse {
  data: Incident[];
  current_limit: number;
  current_page: number;
  total_count: number;
  total_pages: number;
}

// Severity badge variants
const severityVariants = {
  critical: 'bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/25 dark:text-red-500',
  high: 'bg-orange-500/15 text-orange-600 border-orange-500/20 hover:bg-orange-500/25 dark:text-orange-500',
  medium:
    'bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25 dark:text-yellow-500',
  unknown: 'bg-muted text-muted-foreground',
};

// Table columns definition
const columns: ColumnDef<Incident>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      return (
        <div className="flex items-center gap-2">
          {type === 'secret' ? (
            <KeyRoundIcon className="h-4 w-4 text-orange-500" />
          ) : (
            <BugIcon className="h-4 w-4 text-destructive" />
          )}
          <span className="capitalize">{type}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'vulnerability.repository.name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Repository
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.vulnerability?.repository?.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.vulnerability?.repository?.author}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'vulnerability.severity',
    header: 'Severity',
    cell: ({ row }) => {
      const severity = (row.original.vulnerability?.severity || 'unknown').toLowerCase();
      return (
        <Badge
          variant="outline"
          className={severityVariants[severity as keyof typeof severityVariants]}
        >
          {severity.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'vulnerability.package',
    header: 'Package',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.vulnerability?.package}</span>
        <span className="text-xs text-muted-foreground">
          Version: {row.original.vulnerability?.package_version}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('status') === 'open' ? 'destructive' : 'secondary'}>
        {row.getValue('status')}
      </Badge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span>{new Date(row.getValue('created_at')).toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue('created_at')).toLocaleTimeString()}
          </span>
        </div>
      );
    },
  },
];

// Loading component
const TableSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-8 w-1/4 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-10 w-[200px] animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-[200px] animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

function IncidentsTableComponent({
  commonAPIRequest,
  dateRange,
}: {
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
  dateRange: { from: string; to: string };
}) {
  const [data, setData] = React.useState<Incident[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    current_limit: 10,
    current_page: 1,
    total_count: 0,
    total_pages: 0,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchIncidents = React.useCallback(
    (page = 1) => {
      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.incidentsDashboard.getIncidents;
      const baseUrl = createEndpointUrl(endpoint);

      // Construct data object instead of query params
      const requestData = {
        page,
        limit: 10,
        severities: ['critical', 'high'],
        statuses: ['open'],
        from_date: dateRange.from,
        to_date: dateRange.to,
        incident_type: 'vulnerability',
      };

      commonAPIRequest<APIResponse>(
        {
          api: baseUrl,
          method: endpoint.method,
          data: requestData,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setData(response.data);
            setPagination({
              current_limit: response.current_limit,
              current_page: response.current_page,
              total_count: response.total_count,
              total_pages: response.total_pages,
            });
          }
        }
      );
    },
    [commonAPIRequest, dateRange]
  );

  React.useEffect(() => {
    fetchIncidents();
  }, [dateRange]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardHeader className="border-b bg-muted/40 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                Security Incidents
              </h2>
              <p className="text-sm text-muted-foreground max-w-[600px]">
                Monitor and manage security incidents and vulnerabilities across your repositories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <FileDownIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export incident data</TooltipContent>
              </Tooltip> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Toggle columns
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          <div className="flex items-center gap-2">
                            {column.id === 'type' && <LayersIcon className="h-4 w-4" />}
                            {column.id === 'repository.name' && <GitForkIcon className="h-4 w-4" />}
                            {column.id === 'secret.severity' && (
                              <AlertTriangleIcon className="h-4 w-4" />
                            )}
                            {column.id === 'secret.file' && <FileTextIcon className="h-4 w-4" />}
                            {column.id === 'status' && <CircleDotIcon className="h-4 w-4" />}
                            {column.id === 'created_at' && <CalendarIcon className="h-4 w-4" />}
                            {column.id.replace(/\..*/g, '')}
                          </div>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => fetchIncidents(pagination.current_page)}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-[400px] text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-muted/50 p-6">
                          <AlertCircle className="h-12 w-12 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-medium text-muted-foreground">
                            No incidents found
                          </h3>
                          <p className="text-sm text-muted-foreground/80 max-w-[400px] mx-auto">
                            Great news! No security incidents have been detected within the selected
                            time period. Keep monitoring to maintain your security posture.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fetchIncidents(1)}
                          className="gap-2"
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4 px-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {pagination.total_count > 0 ? (
                <>
                  Showing {(pagination.current_page - 1) * pagination.current_limit + 1} to{' '}
                  {Math.min(
                    pagination.current_page * pagination.current_limit,
                    pagination.total_count
                  )}{' '}
                  of {pagination.total_count} results
                </>
              ) : (
                'No results found'
              )}
            </div>
            <div className="flex items-center space-x-6  lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchIncidents(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <div className="flex w-[100px] justify-center text-sm font-medium">
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchIncidents(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export const ScaOpenIncidentsTable = withAPIRequest(IncidentsTableComponent);
