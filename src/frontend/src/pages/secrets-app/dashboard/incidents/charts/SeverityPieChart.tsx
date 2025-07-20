import * as React from 'react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Card, CardContent } from '@/components/ui/card';
import { Pie, PieChart } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type SeverityData = {
  value: string;
  label: string;
  count: number;
};

type ChartProps = {
  severity_breakdown: SeverityData[];
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

function SeverityPieChartComponent({ commonAPIRequest, dateRange }: APIRequestProps) {
  const [data, setData] = React.useState<ChartProps | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSeverityData = React.useCallback(() => {
    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.incidentsDashboard.getSeverityBreakdown;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<ChartProps>(
      {
        api: apiUrl,
        method: endpoint.method,
        params: {
          status: 'open',
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
  }, [commonAPIRequest]);

  React.useEffect(() => {
    fetchSeverityData();
  }, [fetchSeverityData, dateRange]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.severity_breakdown.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Keep the header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
              Security Severity
            </h2>
            <p className="text-sm text-muted-foreground max-w-[600px]">
              Overview of incident severity levels and their distribution across your security
              infrastructure.
            </p>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            {/* Empty State Icon */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-full">
                <AlertCircle className="h-12 w-12 text-orange-500" />
                {/* <PieChart className="h-12 w-12 text-orange-500" /> */}
              </div>
            </div>

            {/* Empty State Message */}
            <h3 className="text-xl font-medium text-center mb-2">No Severity Data</h3>
            <p className="text-muted-foreground text-center max-w-[300px] mb-4">
              No security incidents were detected for the selected period
            </p>

            {/* Date Range Info */}
            <p className="text-sm text-muted-foreground mt-6">
              {new Date(dateRange.from).toLocaleDateString()} -{' '}
              {new Date(dateRange.to).toLocaleDateString()}
            </p>

            {/* Refresh Button */}
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
            <p className="text-sm text-muted-foreground">Loading severity data...</p>
          </div>
        </div>
      </Card>
    );
  }

  const pieData = data.severity_breakdown.map((item) => ({
    name: item.label,
    value: item.count,
    fill:
      CHART_CONFIG[item.value as keyof typeof CHART_CONFIG]?.color || CHART_CONFIG.unknown.color,
  }));

  const totalIncidents = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
            Security Severity
          </h2>
          <p className="text-sm text-muted-foreground max-w-[600px]">
            Overview of incident severity levels and their distribution across your security
            infrastructure.
          </p>
        </div>

        {/* Chart */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <ChartContainer config={CHART_CONFIG} className="h-[300px] w-[300px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="name"
                      formatter={(value) => [value.toLocaleString(), ' Incidents']}
                    />
                  }
                />
                <Pie
                  data={pieData}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold">{totalIncidents.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Incidents</div>
            </div>
          </div>

          {/* Legend & Stats */}
          <div className="w-full">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex flex-col items-center gap-4">
                {/* First Row - 3 items */}
                <div className="flex items-center justify-center gap-6">
                  {Object.entries(CHART_CONFIG)
                    .filter(([key]) => key !== 'count')
                    .slice(0, 3)
                    .map(([key, config]) => {
                      const dataItem = pieData.find(
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
                      const dataItem = pieData.find(
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const SeverityPieChart = withAPIRequest(SeverityPieChartComponent);
