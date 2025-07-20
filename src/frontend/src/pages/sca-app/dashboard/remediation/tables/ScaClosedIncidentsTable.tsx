import * as React from 'react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  GitForkIcon,
  KeyRoundIcon,
  BugIcon,
  FileDownIcon,
  SlidersHorizontalIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  EyeIcon,
  LockIcon,
} from 'lucide-react';
import { CaretSortIcon } from '@radix-ui/react-icons';

// Types
type IncidentType = 'secret' | 'vulnerability';

interface Vulnerability {
  severity: string;
  package: string;
  package_version: string;
  description: string;
  repository: Repository;
  cve_id: string;
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
  name: string;
  status: string;
  type: string;
  created_at: string;
  vulnerability: Vulnerability;
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

interface APIRequestProps {
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
  dateRange: { from: string; to: string };
}

// Severity badge variants
const getSeverityVariant = (severity: string) => {
  const variants = {
    critical: 'bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/25 dark:text-red-400',
    high: 'bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/25 dark:text-blue-400',
    medium:
      'bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25 dark:text-yellow-400',
    unknown: 'bg-muted text-muted-foreground',
  };
  return variants[severity as keyof typeof variants] || variants.unknown;
};

function ClosedIncidentsTableComponent({ commonAPIRequest, dateRange }: APIRequestProps) {
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

  // Table columns
  const columns: ColumnDef<Incident>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-md ${type === 'secret' ? 'bg-blue-500/10' : 'bg-red-500/10'}`}
            >
              {type === 'secret' ? (
                <KeyRoundIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <BugIcon className="h-4 w-4 text-red-600" />
              )}
            </div>
            <span className="capitalize font-medium">{type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'vulnerability.repository.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="font-semibold hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Repository
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-md">
            <GitForkIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.vulnerability?.repository?.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.vulnerability?.repository?.author}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'vulnerability.severity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="font-semibold hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Severity
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const severity = row.original.vulnerability?.severity?.toLowerCase() || 'unknown';
        return (
          <Badge variant="outline" className={getSeverityVariant(severity)}>
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
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="font-semibold hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return (
          <div className="flex flex-col">
            <span>{date.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
          </div>
        );
      },
    },
  ];

  const fetchIncidents = React.useCallback(
    (page = 1) => {
      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.incidentsDashboard.getIncidents;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest<APIResponse>(
        {
          api: apiUrl,
          method: endpoint.method,
          data: {
            page,
            limit: 10,
            statuses: ['closed'],
            from_date: dateRange.from,
            to_date: dateRange.to,
            incident_type: 'vulnerability',
          },
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
    [commonAPIRequest]
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
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading incidents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                Closed Incidents
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground max-w-[600px]">
                  Track and manage active security incidents that require attention.
                </p>
                <Badge
                  variant="outline"
                  className="bg-orange-500/10 text-orange-600 border-orange-500/20"
                >
                  {pagination.total_count.toLocaleString()} active
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <FileDownIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export closed incidents</TooltipContent>
              </Tooltip> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id.replace(/\..*/g, '')}
                      </DropdownMenuCheckboxItem>
                    ))}
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

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-400/10 dark:to-amber-400/10"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-muted/50">
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
                        <div className="rounded-full bg-orange-500/10 dark:bg-orange-500/20 p-6">
                          <LockIcon className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-medium text-orange-500 dark:text-orange-400">
                            No closed incidents found
                          </h3>
                          <p className="text-sm text-muted-foreground/80 max-w-[400px] mx-auto">
                            There are no closed security incidents in your repositories for the
                            selected time period.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fetchIncidents(1)}
                          className="gap-2 hover:bg-orange-500/10 hover:text-orange-500 dark:hover:text-orange-400"
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
              {pagination.total_count > 0 ? (
                <>
                  Showing {(pagination.current_page - 1) * pagination.current_limit + 1} to{' '}
                  {Math.min(
                    pagination.current_page * pagination.current_limit,
                    pagination.total_count
                  )}{' '}
                  of {pagination.total_count.toLocaleString()} incidents
                </>
              ) : (
                'No closed incidents'
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
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

export const ScaClosedIncidentsTable = withAPIRequest(ClosedIncidentsTableComponent);
