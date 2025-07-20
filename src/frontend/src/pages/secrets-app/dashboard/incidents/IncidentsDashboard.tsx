import React from 'react';
import { IncidentLineChart } from './charts/IncidentLineChart';
import { SeverityPieChart } from './charts/SeverityPieChart';
import { IncidentsTable } from './tables/IncidentsTable';

const IncidentsDashboard = ({ dateRange }: { dateRange: { from: string; to: string } }) => {
  return (
    <div className="space-y-4">
      {/* First row with line chart and pie chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr] mt-4">
        <div className="w-full">
          <IncidentLineChart dateRange={dateRange} />
        </div>
        <div className="w-full">
          <SeverityPieChart dateRange={dateRange} />
        </div>
      </div>

      {/* Second row with table */}
      <div className="w-full">
        <IncidentsTable dateRange={dateRange} />
      </div>
    </div>
  );
};

export default IncidentsDashboard;
