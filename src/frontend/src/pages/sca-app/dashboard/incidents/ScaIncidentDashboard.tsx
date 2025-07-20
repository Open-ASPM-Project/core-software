import { ScaOpenIncidentsLineChart } from './charts/ScaOpenIncidentsLineChart';
import { ScaOpenIncidentsSeverityPieChart } from './charts/ScaOpenIncidentsSeverityPieChart';
import { ScaOpenIncidentsTable } from './tables/ScaOpenIncidentsTable';

const ScaIncidentsDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <ScaOpenIncidentsLineChart dateRange={dateRange} />
        </div>
        <div className="w-full">
          <ScaOpenIncidentsSeverityPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with table */}
      <div className="w-full">
        <ScaOpenIncidentsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default ScaIncidentsDashboard;
