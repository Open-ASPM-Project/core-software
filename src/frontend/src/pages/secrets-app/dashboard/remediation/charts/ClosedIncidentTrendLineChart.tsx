import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

type Interval = (typeof INTERVALS)[number]['value'];

const CHART_CONFIG = {
  incidents: {
    label: 'Closed Incidents',
    color: 'hsl(var(--chart-1))',
  },
  repos: {
    label: 'Remediated Assets',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface IncidentData {
  date: string;
  incident_count: number;
  repo_count: number;
}

interface ChartProps {
  interval: string;
  incident_data: IncidentData[];
  from_date: string;
  to_date: string;
}

interface APIRequestProps {
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
}

const getDateFromWeek = (weekStr: string) => {
  // Parse year and week
  const [year, week] = weekStr.split('-W').map(Number);

  // Create date starting at Jan 1st of the year
  const date = new Date(year, 0, 1 + (week - 1) * 7);

  // Adjust to Monday of that week
  date.setDate(date.getDate() + (1 - date.getDay()));

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function ClosedIncidentTrendLineChartComponent({ commonAPIRequest, dateRange }: APIRequestProps) {
  const [data, setData] = React.useState<ChartProps | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeMetric, setActiveMetric] = React.useState<'incidents' | 'repos'>('incidents');
  const [selectedInterval, setSelectedInterval] = React.useState<Interval>('daily');

  const fetchData = React.useCallback(() => {
    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.incidentsDashboard.getIncidentsTrend;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<ChartProps>(
      {
        api: apiUrl,
        method: endpoint.method,
        params: {
          interval: selectedInterval,
          status: 'closed',
          from_date: dateRange.from,
          to_date: dateRange.to,
          incident_type: 'secret',
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setData(response);
        }
      }
    );
  }, [commonAPIRequest, selectedInterval]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, dateRange]);

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
      <Card className="w-full">
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading trend data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.incident_data.length === 0) {
    return (
      <Card className="h-full">
        <div className="flex flex-col gap-6 p-6">
          {/* Keep the header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                Remediation Trend
              </h2>
              <p className="text-sm text-muted-foreground max-w-[600px]">
                Track the progress of incident remediation and asset recovery over time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedInterval}
                onValueChange={(value: Interval) => setSelectedInterval(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Empty State Content */}
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-full mb-4">
              <AlertCircle className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Closed Incidents Found</h3>
            <p className="text-muted-foreground text-center max-w-[400px] mb-6">
              No security incidents were detected during the selected time period:
              {new Date(dateRange.from).toLocaleDateString()} -{' '}
              {new Date(dateRange.to).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const total = {
    incidents: data.incident_data.reduce((acc, curr) => acc + curr.incident_count, 0),
    repos: data.incident_data.reduce((acc, curr) => acc + curr.repo_count, 0),
  };

  const chartData = data.incident_data.map((item) => ({
    date: item.date,
    incidents: item.incident_count,
    repos: item.repo_count,
  }));

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
              Remediation Trend
            </h2>
            <p className="text-sm text-muted-foreground max-w-[600px]">
              Track the progress of incident remediation and asset recovery over time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedInterval}
              onValueChange={(value: Interval) => setSelectedInterval(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(CHART_CONFIG) as Array<keyof typeof CHART_CONFIG>).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={cn(
                'flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50',
                activeMetric === metric && 'border-primary/50 bg-primary/5'
              )}
            >
              <span className="text-sm font-medium text-muted-foreground">
                {CHART_CONFIG[metric].label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {total[metric as keyof typeof total].toLocaleString()}
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedInterval}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-lg border bg-card p-4">
          <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  selectedInterval === 'weekly'
                    ? getDateFromWeek(value)
                    : new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey={CHART_CONFIG[activeMetric].label}
                    labelFormatter={(value) =>
                      selectedInterval === 'weekly'
                        ? getDateFromWeek(value)
                        : new Date(value).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                    }
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={activeMetric}
                stroke={`var(--color-${activeMetric})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export const ClosedIncidentTrendLineChart = withAPIRequest(ClosedIncidentTrendLineChartComponent);
