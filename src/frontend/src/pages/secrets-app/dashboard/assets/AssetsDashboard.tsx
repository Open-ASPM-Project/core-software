import React from 'react';
import { AssetsTable } from './tables/AssetsTable';
import { RepoSplitPieChart } from './charts/RepoSplitPieChart';
import { IncidentLineChart } from '../incidents/charts/IncidentLineChart';

const AssetsDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <IncidentLineChart dateRange={dateRange} assets />
        </div>
        <div className="w-full">
          <RepoSplitPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with table */}
      <div className="w-full">
        <AssetsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default AssetsDashboard;
