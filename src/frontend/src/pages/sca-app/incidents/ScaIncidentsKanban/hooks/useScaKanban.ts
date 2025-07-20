import { useState } from 'react';

interface VulnerabilityDetails {
  severity: string;
  description: string;
  package: string;
  package_version: string;
  fix_available: boolean;
  cvss_base_score: number;
  cve_id: string;
}

export interface ScaIncident {
  id: number;
  name: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
  closed_by: string | null;
  vulnerability: VulnerabilityDetails;
}

interface UseScaKanbanReturn {
  // State
  openIncidents: ScaIncident[];
  inProgressIncidents: ScaIncident[];
  closedIncidents: ScaIncident[];

  // Setters
  setOpenIncidents: (incidents: ScaIncident[]) => void;
  setInProgressIncidents: (incidents: ScaIncident[]) => void;
  setClosedIncidents: (incidents: ScaIncident[]) => void;

  // Utils
  moveIncident: (incidentId: number, from: string, to: string, targetIndex?: number) => void;
  getIncidentsList: (columnId: string) => ScaIncident[];
}

export const useScaKanban = (): UseScaKanbanReturn => {
  const [openIncidents, setOpenIncidents] = useState<ScaIncident[]>([]);
  const [inProgressIncidents, setInProgressIncidents] = useState<ScaIncident[]>([]);
  const [closedIncidents, setClosedIncidents] = useState<ScaIncident[]>([]);

  const moveIncident = (incidentId: number, from: string, to: string, targetIndex?: number) => {
    let incident: ScaIncident | undefined;

    // Find and remove incident from source
    switch (from) {
      case 'open':
        incident = openIncidents.find((i) => i.id === incidentId);
        setOpenIncidents((prev) => prev.filter((i) => i.id !== incidentId));
        break;
      case 'inProgress':
        incident = inProgressIncidents.find((i) => i.id === incidentId);
        setInProgressIncidents((prev) => prev.filter((i) => i.id !== incidentId));
        break;
      case 'closed':
        incident = closedIncidents.find((i) => i.id === incidentId);
        setClosedIncidents((prev) => prev.filter((i) => i.id !== incidentId));
        break;
    }

    if (!incident) return;

    // Update incident status based on destination
    const updatedIncident = {
      ...incident,
      status: to === 'closed' ? 'closed' : to === 'inProgress' ? 'in-progress' : 'open',
    };

    // Helper function to add incident at specific index or end
    const addIncidentAtIndex = (
      incidents: ScaIncident[],
      incident: ScaIncident,
      index?: number
    ) => {
      if (typeof index === 'number') {
        const newIncidents = [...incidents];
        newIncidents.splice(index, 0, incident);
        return newIncidents;
      }
      return [...incidents, incident];
    };

    // Add to destination
    switch (to) {
      case 'open':
        setOpenIncidents((prev) => addIncidentAtIndex(prev, updatedIncident, targetIndex));
        break;
      case 'inProgress':
        setInProgressIncidents((prev) => addIncidentAtIndex(prev, updatedIncident, targetIndex));
        break;
      case 'closed':
        setClosedIncidents((prev) => addIncidentAtIndex(prev, updatedIncident, targetIndex));
        break;
    }
  };

  const getIncidentsList = (columnId: string): ScaIncident[] => {
    switch (columnId) {
      case 'open':
        return openIncidents;
      case 'inProgress':
        return inProgressIncidents;
      case 'closed':
        return closedIncidents;
      default:
        return [];
    }
  };

  return {
    // State
    openIncidents,
    inProgressIncidents,
    closedIncidents,

    // Setters
    setOpenIncidents,
    setInProgressIncidents,
    setClosedIncidents,

    // Utils
    moveIncident,
    getIncidentsList,
  };
};
