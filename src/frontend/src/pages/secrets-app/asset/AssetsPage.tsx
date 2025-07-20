import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RepositoriesTab from './tabs/RepositoriesTab';
import { useSearchParams } from 'react-router-dom';
import GroupsTab from './tabs/GroupsTab';
import SecretsTab from './tabs/SecretsTab';
import { AlertCircle, FolderPlus, GitFork, GitPullRequest, KeyRound } from 'lucide-react';
import FlickeringGrid from '@/components/ui/flickering-grid';

type Props = {};

const AssetsPage = (props: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'groups';

  const handleTabChange = (value: string) => {
    // Create new URLSearchParams with only the tab parameter
    setSearchParams({ tab: value }, { replace: true });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) {
      setSearchParams({ tab: 'groups' });
    } else {
      handleTabChange(tab);
    }
  }, [currentTab]);

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-t-lg">
      {/* <FlickeringGrid
        className="z-0 absolute inset-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#2563eb"
        maxOpacity={0.4}
        flickerChance={0.1}
        height={800}
        width={1200}
      /> */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="relative overflow-hidden rounded-lg border bg-card p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20" />

          <div className="relative flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 border border-blue-200/50 dark:border-blue-700/30 shadow-inner">
                <GitPullRequest className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-400">
                  Secret Assets
                </h2>
                <p className="text-sm text-muted-foreground max-w-[600px]">
                  Comprehensive asset inventory, enabling efficient management and risk assessment
                  of code bases.
                </p>
              </div>
            </div>
            {/* Left side with title and description */}

            {/* Right side with tabs */}
            <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 p-1 text-muted-foreground">
              <TabsTrigger
                value="groups"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Groups
              </TabsTrigger>

              <TabsTrigger
                value="repos"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <GitFork className="h-4 w-4" />
                Repos
              </TabsTrigger>

              <TabsTrigger
                value="secrets"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/80 dark:hover:bg-zinc-950/80 gap-2"
              >
                <KeyRound className="h-4 w-4" />
                Secrets
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="repos">
          <RepositoriesTab />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="secrets">
          <SecretsTab />
        </TabsContent>

        <TabsContent className="p-4 pt-0 m-0 border-none shadow-none" value="groups">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetsPage;
