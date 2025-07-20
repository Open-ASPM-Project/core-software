import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentsDashboard from './incidents/IncidentsDashboard';
import AssetsDashboard from './assets/AssetsDashboard';
import { AlertTriangle, Database, LayoutDashboard, Wrench } from 'lucide-react';
import RemediationDashboard from './remediation/RemediationDashboard';
import DateRangePicker from '@/components/date-picker/DateRangePicker';

export default function SecretAppDashboard() {
  const [dateRange, setDateRange] = React.useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  console.log('date-range-outside', dateRange);
  return (
    <div className="flex-1 container item-center mx-auto space-y-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      <Tabs defaultValue="incidents">
        <div className="relative overflow-hidden rounded-lg border bg-card p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-600/20 dark:to-amber-600/20" />

          <div className="relative flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200/50 dark:border-orange-700/30 shadow-inner">
                <LayoutDashboard className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                  Secret Dashboard
                </h2>
                <p className="text-sm text-muted-foreground max-w-[600px]">
                  Comprehensive overview of security incidents, assets, and remediation status
                  across your organization.
                </p>
              </div>
            </div>
            {/* Left side with title and description */}
            <div className="flex flex-col gap-2"></div>

            {/* Right side with date picker and tabs */}
            <div className="flex flex-col items-end gap-4">
              <div className="flex justify-end">
                <DateRangePicker setDateRange={setDateRange} fromColor="orange" toColor="amber" />
              </div>
              <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-600/20 dark:to-amber-600/20 p-1 text-muted-foreground">
                <TabsTrigger
                  value="incidents"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Incidents
                </TabsTrigger>

                <TabsTrigger
                  value="assets"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Database className="h-4 w-4" />
                  Assets
                </TabsTrigger>

                <TabsTrigger
                  value="remidiation"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Wrench className="h-4 w-4" />
                  Remediation
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="incidents">
          <IncidentsDashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="assets">
          <AssetsDashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="remidiation">
          <RemediationDashboard dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
