import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Boxes, KanbanIcon, Package, Table2 } from 'lucide-react';
import ScaIncidentsTab from './IncidentsTable/ScaIncidentsTab';
import ScaIncidentsKanbanBoard from './ScaIncidentsKanban/ScaIncidentsKanbanBoard';

const ScaIncidentsPage = () => {
  const [view, setView] = useState<'kanban' | 'table'>('table');

  return (
    <div className="flex-1 container mx-auto space-y-4 p-4 mt-8 bg-gradient-to-b from-background via-background/80 to-background/50 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg backdrop-blur-sm">
      <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 p-6 -mx-4 -mt-4 rounded-t-lg border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex-1 space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 border border-emerald-200/50 dark:border-emerald-700/30 shadow-inner">
                <Boxes className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
                  SCA Incidents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Monitor and manage software composition analysis incidents
                </p>
              </div>
            </div>

            <Tabs
              value={view}
              onValueChange={(v) => setView(v as 'kanban' | 'table')}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2 p-1.5 gap-2 bg-white/5 dark:bg-black/5 border border-gray-200/20 dark:border-gray-800/20 rounded-xl backdrop-blur-xl shadow-[inset_0px_0.5px_4px_-1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0px_0.5px_4px_-1px_rgba(255,255,255,0.05)]">
                <TabsTrigger
                  value="table"
                  className={`
                    relative group
                    px-4 py-2.5
                    flex items-center justify-center gap-3
                    transition-all duration-500
                    rounded-lg
                    overflow-hidden
                    data-[state=active]:shadow-lg
                    data-[state=active]:scale-[1.02]
                    data-[state=active]:bg-gradient-to-r
                    data-[state=active]:from-emerald-500/10
                    data-[state=active]:to-cyan-500/10
                    dark:data-[state=active]:from-emerald-400/10
                    dark:data-[state=active]:to-cyan-400/10
                  `}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 dark:from-emerald-400/5 dark:to-cyan-400/5" />

                  {/* Icon Container */}
                  <div
                    className={`
                      relative
                      flex items-center justify-center
                      w-8 h-8 rounded-lg
                      transition-all duration-500 ease-out
                      group-data-[state=active]:bg-gradient-to-r
                      group-data-[state=active]:from-emerald-500
                      group-data-[state=active]:to-cyan-500
                      dark:group-data-[state=active]:from-emerald-400
                      dark:group-data-[state=active]:to-cyan-400
                      group-data-[state=active]:shadow-lg
                      group-data-[state=active]:shadow-emerald-500/25
                      dark:group-data-[state=active]:shadow-emerald-400/25
                      group-hover:scale-110
                      group-data-[state=inactive]:bg-gray-100
                      dark:group-data-[state=inactive]:bg-gray-800
                    `}
                  >
                    <Table2
                      className={`
                        w-4 h-4
                        transition-colors duration-500
                        group-data-[state=active]:text-white
                        group-data-[state=inactive]:text-gray-600
                        dark:group-data-[state=inactive]:text-gray-400
                      `}
                    />
                  </div>

                  {/* Text */}
                  <span
                    className={`
                      relative font-medium
                      transition-colors duration-500
                      group-data-[state=active]:text-emerald-600
                      dark:group-data-[state=active]:text-emerald-400
                      group-data-[state=inactive]:text-gray-600
                      dark:group-data-[state=inactive]:text-gray-400
                    `}
                  >
                    Table View
                  </span>

                  {/* Active Indicator */}
                  <div
                    className={`
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      w-12 h-0.5 rounded-full
                      transition-all duration-500
                      group-data-[state=active]:bg-gradient-to-r
                      group-data-[state=active]:from-emerald-500
                      group-data-[state=active]:to-cyan-500
                      dark:group-data-[state=active]:from-emerald-400
                      dark:group-data-[state=active]:to-cyan-400
                      opacity-0 group-data-[state=active]:opacity-100
                      scale-0 group-data-[state=active]:scale-100
                    `}
                  />
                </TabsTrigger>

                <TabsTrigger
                  value="kanban"
                  className={`
                    relative group
                    px-4 py-2.5
                    flex items-center justify-center gap-3
                    transition-all duration-500
                    rounded-lg
                    overflow-hidden
                    data-[state=active]:shadow-lg
                    data-[state=active]:scale-[1.02]
                    data-[state=active]:bg-gradient-to-r
                    data-[state=active]:from-emerald-500/10
                    data-[state=active]:to-cyan-500/10
                    dark:data-[state=active]:from-emerald-400/10
                    dark:data-[state=active]:to-cyan-400/10
                  `}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 dark:from-emerald-400/5 dark:to-cyan-400/5" />

                  {/* Icon Container */}
                  <div
                    className={`
                      relative
                      flex items-center justify-center
                      w-8 h-8 rounded-lg
                      transition-all duration-500 ease-out
                      group-data-[state=active]:bg-gradient-to-r
                      group-data-[state=active]:from-emerald-500
                      group-data-[state=active]:to-cyan-500
                      dark:group-data-[state=active]:from-emerald-400
                      dark:group-data-[state=active]:to-cyan-400
                      group-data-[state=active]:shadow-lg
                      group-data-[state=active]:shadow-emerald-500/25
                      dark:group-data-[state=active]:shadow-emerald-400/25
                      group-hover:scale-110
                      group-data-[state=inactive]:bg-gray-100
                      dark:group-data-[state=inactive]:bg-gray-800
                    `}
                  >
                    <KanbanIcon
                      className={`
                        w-4 h-4
                        transition-colors duration-500
                        group-data-[state=active]:text-white
                        group-data-[state=inactive]:text-gray-600
                        dark:group-data-[state=inactive]:text-gray-400
                      `}
                    />
                  </div>

                  {/* Text */}
                  <span
                    className={`
                      relative font-medium
                      transition-colors duration-500
                      group-data-[state=active]:text-emerald-600
                      dark:group-data-[state=active]:text-emerald-400
                      group-data-[state=inactive]:text-gray-600
                      dark:group-data-[state=inactive]:text-gray-400
                    `}
                  >
                    Kanban Board
                  </span>

                  {/* Active Indicator */}
                  <div
                    className={`
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      w-12 h-0.5 rounded-full
                      transition-all duration-500
                      group-data-[state=active]:bg-gradient-to-r
                      group-data-[state=active]:from-emerald-500
                      group-data-[state=active]:to-cyan-500
                      dark:group-data-[state=active]:from-emerald-400
                      dark:group-data-[state=active]:to-cyan-400
                      opacity-0 group-data-[state=active]:opacity-100
                      scale-0 group-data-[state=active]:scale-100
                    `}
                  />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="rounded-md border border-gray-200/50 dark:border-gray-800/50 bg-background/50 backdrop-blur-sm">
        {/* {view === 'kanban' ? <ScaIncidentsTab /> : <ScaIncidentsTab />} */}
        {view === 'kanban' ? <ScaIncidentsKanbanBoard /> : <ScaIncidentsTab />}
      </div>
    </div>
  );
};

export default ScaIncidentsPage;
