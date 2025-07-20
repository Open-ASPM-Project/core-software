import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
// import PRScansTab from './tabs/PRScansTab';
// import CommitScansTab from './tabs/CommitScansTab';
// import AllowListTab from './tabs/AllowListTab';
import { GitPullRequest, ShieldCheck } from 'lucide-react';
import ScaPRScansTab from './tabs/ScaPRScansTab';
import ScaAllowlistTab from './tabs/ScaAllowlistTab';

type Props = {};

const ScaScansPage = (props: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pr-scans';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'pr-scans' });
    }
  }, []);

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      <Tabs defaultValue="pr-scans" onValueChange={handleTabChange}>
        <div className="relative overflow-hidden rounded-lg border bg-card p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-600/20 dark:to-blue-600/20" />

          <div className="relative flex items-center justify-between gap-6">
            {/* Left side with title and description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
                SCA Scans
              </h2>
              <p className="text-sm text-muted-foreground max-w-[600px]">
                Live feed of security scan results, providing immediate insight into code changes
                and potential vulnerabilities.
              </p>
            </div>

            {/* Right side with tabs */}
            <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-600/20 dark:to-blue-600/20 p-1 text-muted-foreground">
              <TabsTrigger
                value="pr-scans"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <GitPullRequest className="h-4 w-4" />
                PR Scans
              </TabsTrigger>

              <TabsTrigger
                value="allowlist-sca"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Allow List
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="pr-scans">
          <ScaPRScansTab />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="allowlist-sca">
          <ScaAllowlistTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScaScansPage;
