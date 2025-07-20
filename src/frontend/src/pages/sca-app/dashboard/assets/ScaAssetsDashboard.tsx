import { ScaOpenIncidentsLineChart } from '../incidents/charts/ScaOpenIncidentsLineChart';
import { ScaRepoSplitPieChart } from './charts/ScaRepoSplitPieChart';
import { ScaRepoAssetsTable } from './tables/ScaRepoAssetsTable';

const ScaAssetsDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <ScaOpenIncidentsLineChart dateRange={dateRange} assets />
        </div>
        <div className="w-full">
          <ScaRepoSplitPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with table */}
      <div className="w-full">
        <ScaRepoAssetsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default ScaAssetsDashboard;
