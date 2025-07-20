import * as React from 'react';
import { Pie, PieChart } from 'recharts';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, GitForkIcon } from 'lucide-react';

// ... (types remain the same)
type SeverityData = {
  repo_count: number;
  severity: string;
};

type ChartProps = {
  severities: SeverityData[];
  repo_data_by_severity: string[];
  from_date: string;
  to_date: string;
};

type APIRequestProps = {
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
};

const CHART_CONFIG = {
  count: { label: 'Count' },
  critical: {
    label: 'Critical',
    color: 'hsl(346, 87%, 48%)', // Deep red
  },
  high: {
    label: 'High',
    color: 'hsl(15, 86%, 50%)', // Orange red
  },
  medium: {
    label: 'Medium',
    color: 'hsl(41, 95%, 54%)', // Amber
  },
  low: {
    label: 'Low',
    color: 'hsl(142, 76%, 36%)', // Green
  },
  unknown: {
    label: 'Unknown',
    color: 'hsl(215, 16%, 47%)', // Gray
  },
} satisfies ChartConfig;

function RepoSplitPieChartComponent({ commonAPIRequest, dateRange }: APIRequestProps) {
  const [data, setData] = React.useState<ChartProps | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const transformParams = (params: Record<string, any>) => {
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

  // Then in your component:
  const fetchRepoData = React.useCallback(() => {
    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.assetsDashboard.getRepoSplit;
    const baseUrl = createEndpointUrl(endpoint);

    const params = {
      severities: ['critical', 'high', 'medium', 'unknown'],
      from_date: dateRange.from,
      to_date: dateRange.to,
      incident_type: 'vulnerability',
    };

    commonAPIRequest<ChartProps>(
      {
        api: `${baseUrl}?${transformParams(params)}`,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setData(response);
        }
      }
    );
  }, [commonAPIRequest, dateRange]);

  React.useEffect(() => {
    fetchRepoData();
  }, [fetchRepoData, dateRange]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.repo_data_by_severity.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Keep Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
              Security Severity
            </h2>
            <p className="text-sm text-muted-foreground max-w-[600px]">
              Overview of incident severity levels and their distribution across your security
              infrastructure.
            </p>
          </div>

          {/* Empty State Visualization */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Visual Empty State */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 blur-2xl rounded-full" />
              <div className="relative h-[200px] w-[200px] rounded-full border-4 border-dashed border-orange-500/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-full p-3 mb-2 mx-auto w-fit">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">No Data</span>
                </div>
              </div>
            </div>

            {/* Placeholder Legend with sample data */}
            <div className="w-full max-w-md">
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="w-full">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex flex-col items-center gap-4">
                      {/* First Row */}
                      <div className="flex items-center justify-center gap-6">
                        {Object.entries(CHART_CONFIG)
                          .filter(([key]) => key !== 'count')
                          .slice(0, 3)
                          .map(([key, config]) => (
                            <div key={key} className="inline-flex items-center gap-1.5 opacity-40">
                              <div
                                className="h-2 w-2 rounded-sm"
                                style={{ backgroundColor: config.color }}
                              />
                              <span className="text-sm">{config.label}</span>
                              <span className="text-sm font-medium text-muted-foreground">0</span>
                            </div>
                          ))}
                      </div>

                      {/* Second Row */}
                      <div className="flex items-center justify-center gap-6">
                        {Object.entries(CHART_CONFIG)
                          .filter(([key]) => key !== 'count')
                          .slice(3, 5)
                          .map(([key, config]) => (
                            <div key={key} className="inline-flex items-center gap-1.5 opacity-40">
                              <div
                                className="h-2 w-2 rounded-sm"
                                style={{ backgroundColor: config.color }}
                              />
                              <span className="text-sm">{config.label}</span>
                              <span className="text-sm font-medium text-muted-foreground">0</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(dateRange.from).toLocaleDateString()} -{' '}
                    {new Date(dateRange.to).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Empty State Message */}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading repository data...</p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = data.repo_data_by_severity.map((item) => ({
    name: CHART_CONFIG[item.severity as keyof typeof CHART_CONFIG]?.label || item.severity,
    value: item.repo_count,
    fill:
      CHART_CONFIG[item.severity as keyof typeof CHART_CONFIG]?.color || CHART_CONFIG.unknown.color,
  }));

  const totalRepos = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
            Repository Risk
          </h2>
          <p className="text-sm text-muted-foreground max-w-[600px]">
            Distribution of repositories based on their highest incident severity level and current
            risk status.
          </p>
        </div>

        {/* Chart and Stats */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <ChartContainer config={CHART_CONFIG} className="h-[300px] w-[300px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="name"
                      formatter={(value) => [value.toLocaleString(), ' Repositories']}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="100%"
                  paddingAngle={4}
                  label={({ name, value }) => `${value}`}
                  labelLine={false}
                />
              </PieChart>
            </ChartContainer>
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{totalRepos.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Assets</div>
            </div>
          </div>
          {/* Legend & Stats */}

          {/*  */}

          <div className="w-full">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex flex-col items-center gap-4">
                {/* First Row - 3 items */}
                <div className="flex items-center justify-center gap-6">
                  {Object.entries(CHART_CONFIG)
                    .filter(([key]) => key !== 'count')
                    .slice(0, 3)
                    .map(([key, config]) => {
                      const dataItem = chartData.find(
                        (item) => item.name.toLowerCase() === config.label.toLowerCase()
                      );
                      return (
                        <div key={key} className="inline-flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-sm"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-sm">{config.label}</span>
                          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                            {dataItem ? dataItem.value.toLocaleString() : '0'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Second Row - 2 items */}
                <div className="flex items-center justify-center gap-6">
                  {Object.entries(CHART_CONFIG)
                    .filter(([key]) => key !== 'count')
                    .slice(3, 5)
                    .map(([key, config]) => {
                      const dataItem = chartData.find(
                        (item) => item.name.toLowerCase() === config.label.toLowerCase()
                      );
                      return (
                        <div key={key} className="inline-flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-sm"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-sm">{config.label}</span>
                          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                            {dataItem ? dataItem.value.toLocaleString() : '0'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Total Repositories Section */}
                <div className="w-full border-t pt-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <GitForkIcon className="h-4 w-4" />
                      Total Repositories
                    </span>
                    <span className="text-xl font-bold">{totalRepos.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*  */}
        </div>
      </CardContent>
    </Card>
  );
}

export const ScaRepoSplitPieChart = withAPIRequest(RepoSplitPieChartComponent);
