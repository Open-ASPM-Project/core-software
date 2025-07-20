import React from 'react';
import { ClosedIncidentsTable } from './tables/ClosedIncidentsTable';
import { ClosedIncidentTrendLineChart } from './charts/ClosedIncidentTrendLineChart';
import { ClosedIncidentSeverityPieChart } from './charts/ClosedIncidentSeverityPieChart';

type Props = {};

const RemediationDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <ClosedIncidentTrendLineChart dateRange={dateRange} />
        </div>
        <div className="w-full">
          <ClosedIncidentSeverityPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with open incidents table */}
      <div className="w-full">
        <ClosedIncidentsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default RemediationDashboard;
