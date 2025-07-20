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
  UserIcon,
  ShieldAlertIcon,
  FileDownIcon,
  SlidersHorizontalIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  EyeIcon,
} from 'lucide-react';
import { CaretSortIcon } from '@radix-ui/react-icons';

// Types
interface Repository {
  repository_id: number;
  repository_name: string;
  repository_author: string;
  incident_count: number;
}

interface AssetsResponse {
  severities: string[];
  repository_data: Repository[];
  from_date: string;
  to_date: string;
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
const getSeverityBadgeVariant = (count: number) => {
  if (count >= 100) return 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400';
  if (count >= 50)
    return 'bg-orange-500/15 text-orange-600 border-orange-500/20 dark:text-orange-400';
  if (count >= 10)
    return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20 dark:text-yellow-400';
  return 'bg-green-500/15 text-green-600 border-green-500/20 dark:text-green-400';
};

function AssetsTableComponent({ commonAPIRequest, dateRange }: APIRequestProps) {
  // State
  const [data, setData] = React.useState<Repository[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // const [dateRange, setDateRange] = React.useState({ from: '', to: '' });

  const transformArrayParams = (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  };

  // Table columns
  const columns: ColumnDef<Repository>[] = [
    {
      accessorKey: 'repository_name',
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
            <span className="font-medium">{row.original.repository_name}</span>
            <span className="text-xs text-muted-foreground">{row.original.repository_author}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'repository_author',
      header: 'Author',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 dark:bg-purple-500/20 p-2 rounded-md">
            <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span>{row.getValue('repository_author')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'incident_count',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="font-semibold hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Security Issues
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = row.getValue('incident_count') as number;
        return (
          <Badge
            variant="outline"
            className={`${getSeverityBadgeVariant(count)}  gap-2 items-center`}
          >
            <ShieldAlertIcon className="h-3 w-3" />
            {count.toLocaleString()} issues
          </Badge>
        );
      },
    },
    // {
    //   id: 'actions',
    //   cell: ({ row }) => (
    //     <DropdownMenu>
    //       <DropdownMenuTrigger asChild>
    //         <Button variant="ghost" size="icon" className="h-8 w-8">
    //           <MoreHorizontalIcon className="h-4 w-4" />
    //         </Button>
    //       </DropdownMenuTrigger>
    //       <DropdownMenuContent align="end">
    //         <DropdownMenuItem>
    //           <EyeIcon className="mr-2 h-4 w-4" /> View Details
    //         </DropdownMenuItem>
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   ),
    // },
  ];

  // Data fetching
  const fetchAssets = React.useCallback(() => {
    setIsLoading(true);
    const endpoint = API_ENDPOINTS.assetsDashboard.getAssets;
    const apiUrl = createEndpointUrl(endpoint);

    const params = {
      from_date: dateRange.from,
      to_date: dateRange.to,
      incident_type: 'secret',
    };

    const queryString = transformArrayParams(params);

    commonAPIRequest<AssetsResponse>(
      {
        api: `${apiUrl}?${queryString}`,
        method: endpoint.method,
      },

      (response) => {
        setIsLoading(false);
        if (response) {
          setData(response.repository_data);
          // setDateRange({
          //   from: response.from_date,
          //   to: response.to_date,
          // });
        }
      }
    );
  }, [commonAPIRequest]);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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
            <p className="text-sm text-muted-foreground">Loading repository data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIncidents = data.reduce((sum, repo) => sum + repo.incident_count, 0);

  return (
    <TooltipProvider delayDuration={300}>
      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                Security Assets
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground max-w-[600px]">
                  Monitor and manage repositories with detected security incidents and
                  vulnerabilities.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {data.length.toLocaleString()} repositories
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-orange-500/10 text-orange-600 border-orange-500/20"
                  >
                    {totalIncidents.toLocaleString()} incidents
                  </Badge>
                </div>
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
                <TooltipContent>Export assets data</TooltipContent>
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
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={fetchAssets}>
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
                          <GitForkIcon className="h-12 w-12 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-medium text-orange-500 dark:text-orange-400">
                            No repositories found
                          </h3>
                          <p className="text-sm text-muted-foreground/80 max-w-[400px] mx-auto">
                            We haven't detected any security incidents in your repositories for the
                            selected time period.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={fetchAssets}
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

          {/* Footer */}
          <div className="text-xs text-muted-foreground text-center">
            Showing data for period: {new Date(dateRange.from).toLocaleDateString()} to{' '}
            {new Date(dateRange.to).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export const AssetsTable = withAPIRequest(AssetsTableComponent);
