import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { Bug, FolderPlus, Laptop, Image, Database } from 'lucide-react';
import { VMAssetsTab } from './tabs/VMAssetsTab';

const VMAssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  React.useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'groups' });
    }
  }, []);

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      <Tabs defaultValue="groups" onValueChange={handleTabChange}>
        <div className="relative overflow-hidden rounded-lg border bg-card p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 dark:from-emerald-600/20 dark:to-cyan-600/20" />

          <div className="relative flex items-center justify-between gap-6">
            {/* Left side with title and description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
                VM Assets
              </h2>
              <p className="text-sm text-muted-foreground max-w-[600px]">
                Comprehensive vulnerability management asset inventory, enabling efficient
                vulnerability tracking and risk assessment across your infrastructure.
              </p>
            </div>

            {/* Right side with tabs */}
            <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 dark:from-emerald-600/20 dark:to-cyan-600/20 p-1 text-muted-foreground">
              <TabsTrigger
                value="groups"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Groups
              </TabsTrigger>

              <TabsTrigger
                value="assets"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <Database className="h-4 w-4" />
                Assets
              </TabsTrigger>

              <TabsTrigger
                value="tech"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <Laptop className="h-4 w-4" />
                Tech
              </TabsTrigger>

              <TabsTrigger
                value="vulnerabilities"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <Bug className="h-4 w-4" />
                Vulnerabilities
              </TabsTrigger>

              <TabsTrigger
                value="screenshots"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <Image className="h-4 w-4" />
                Screenshots
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="groups">
          <div className="flex justify-center items-center h-60">
            <p className="text-lg font-medium text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="assets">
          <VMAssetsTab />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="tech">
          <div className="flex justify-center items-center h-60">
            <p className="text-lg font-medium text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="vulnerabilities">
          <div className="flex justify-center items-center h-60">
            <p className="text-lg font-medium text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="screenshots">
          <div className="flex justify-center items-center h-60">
            <p className="text-lg font-medium text-muted-foreground">Coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VMAssetsPage;
