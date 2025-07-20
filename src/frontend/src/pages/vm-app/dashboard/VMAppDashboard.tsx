import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Scan, FileWarning, AlertTriangle } from 'lucide-react';
import DateRangePicker from '@/components/date-picker/DateRangePicker';

// Coming Soon component for all tabs
const ComingSoonDisplay = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <AlertTriangle className="h-12 w-12 text-purple-500" />
    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Coming Soon</h3>
    <p className="text-center text-muted-foreground max-w-md">
      This section of the Vulnerability Management dashboard is currently under development. Check
      back soon for full functionality.
    </p>
  </div>
);

export default function VMAppDashboard() {
  const [dateRange, setDateRange] = React.useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      <Tabs defaultValue="vulnerabilities">
        <div className="relative overflow-hidden rounded-lg border bg-card p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-600/20 dark:to-blue-600/20" />

          <div className="relative flex items-center justify-between gap-6">
            {/* Left side with title and description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
                VM Dashboard
              </h2>
              <p className="text-sm text-muted-foreground max-w-[600px]">
                Comprehensive vulnerability management to assess, prioritize, and remediate security
                risks across your organization.
              </p>
            </div>

            {/* Right side with date picker and tabs */}
            <div className="flex flex-col items-end gap-4">
              <div className="flex justify-end">
                <DateRangePicker setDateRange={setDateRange} fromColor="purple" toColor="blue" />
              </div>
              <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-600/20 dark:to-blue-600/20 p-1 text-muted-foreground">
                <TabsTrigger
                  value="vulnerabilities"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Shield className="h-4 w-4" />
                  Vulnerabilities
                </TabsTrigger>

                <TabsTrigger
                  value="assessments"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <Scan className="h-4 w-4" />
                  Assessments
                </TabsTrigger>

                <TabsTrigger
                  value="remediation"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <FileWarning className="h-4 w-4" />
                  Remediation
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="vulnerabilities">
          <ComingSoonDisplay />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="assessments">
          <ComingSoonDisplay />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="remediation">
          <ComingSoonDisplay />
        </TabsContent>
      </Tabs>
    </div>
  );
}
