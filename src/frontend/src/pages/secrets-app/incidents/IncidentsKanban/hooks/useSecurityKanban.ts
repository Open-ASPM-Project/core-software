import { useState } from 'react';
import { SecurityIncident } from '../types';

interface UseSecurityKanbanReturn {
  // State
  openIncidents: SecurityIncident[];
  inProgressIncidents: SecurityIncident[];
  closedIncidents: SecurityIncident[];

  // Setters
  setOpenIncidents: (incidents: SecurityIncident[]) => void;
  setInProgressIncidents: (incidents: SecurityIncident[]) => void;
  setClosedIncidents: (incidents: SecurityIncident[]) => void;

  // Utils
  moveIncident: (incidentId: number, from: string, to: string, targetIndex?: number) => void;
  getIncidentsList: (columnId: string) => SecurityIncident[];
}

export const useSecurityKanban = (): UseSecurityKanbanReturn => {
  const [openIncidents, setOpenIncidents] = useState<SecurityIncident[]>([]);
  const [inProgressIncidents, setInProgressIncidents] = useState<SecurityIncident[]>([]);
  const [closedIncidents, setClosedIncidents] = useState<SecurityIncident[]>([]);

  const moveIncident = (incidentId: number, from: string, to: string, targetIndex?: number) => {
    let incident: SecurityIncident | undefined;

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

    // Add to destination at specific index or end
    const addIncidentAtIndex = (
      incidents: SecurityIncident[],
      incident: SecurityIncident,
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

  const getIncidentsList = (columnId: string): SecurityIncident[] => {
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
