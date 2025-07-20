import { ScaClosedIncidentsSeverityPieChart } from './charts/ScaClosedIncidentsSeverityPieChart';
import { ScaClosedIncidentsTrendLineChart } from './charts/ScaClosedIncidentsTrendLineChart';
import { ScaClosedIncidentsTable } from './tables/ScaClosedIncidentsTable';

const ScaRemediationDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <ScaClosedIncidentsTrendLineChart dateRange={dateRange} />
        </div>
        <div className="w-full">
          <ScaClosedIncidentsSeverityPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with open incidents table */}
      <div className="w-full">
        <ScaClosedIncidentsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default ScaRemediationDashboard;
