import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// import { SecurityTaskCard } from './components/SecurityTaskCard';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { useScaKanban } from './hooks/useScaKanban';
import { ScaIncidentColumn } from './components/ScaIncidentColumn';
import { ScaSortableIncidentCard } from './components/ScaSortableIncidentCard';
import { ScaIncidentTaskCard } from './components/ScaIncidentTaskCard';
import { ScaIncidentFilters } from '../components/ScaIncidentsFilters';

interface ScaIncidentResponse {
  data: Array<{
    id: number;
    name: string;
    status: string;
    type: string;
    created_at: string;
    updated_at: string;
    closed_by: string | null;
    vulnerability: {
      severity: string;
      description: string;
      package: string;
      package_version: string;
      fix_available: boolean;
      cvss_base_score: number;
      cve_id: string;
    };
  }>;
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface ScaKanbanBoardProps {
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const LoadingSkeleton = () => (
  <div className="flex gap-6">
    {[1, 2, 3].map((col) => (
      <div key={col} className="w-[420px] space-y-4">
        {[1, 2, 3].map((card) => (
          <Skeleton key={card} className="h-[200px] rounded-lg" />
        ))}
      </div>
    ))}
  </div>
);

const ScaIncidentsKanbanBoard = ({ commonAPIRequest }: ScaKanbanBoardProps) => {
  const {
    openIncidents,
    inProgressIncidents,
    closedIncidents,
    setOpenIncidents,
    setInProgressIncidents,
    setClosedIncidents,
    moveIncident,
    getIncidentsList,
  } = useScaKanban();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceColumn, setSourceColumn] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const [pagination, setPagination] = useState({
    open: { page: 1, totalPages: 0, totalCount: 0, loading: false },
    inProgress: { page: 1, totalPages: 0, totalCount: 0, loading: false },
    closed: { page: 1, totalPages: 0, totalCount: 0, loading: false },
  });

  const loadMoreIncidents = useCallback(
    async (status: 'open' | 'inProgress' | 'closed') => {
      if (
        !commonAPIRequest ||
        pagination[status].loading ||
        pagination[status].page >= pagination[status].totalPages
      ) {
        return;
      }

      setPagination((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: true },
      }));

      const nextPage = pagination[status].page + 1;

      const statusMap = {
        open: 'open',
        inProgress: 'in-progress',
        closed: 'closed',
      };

      const setters = {
        open: setOpenIncidents,
        inProgress: setInProgressIncidents,
        closed: setClosedIncidents,
      };

      commonAPIRequest<ScaIncidentResponse>(
        {
          api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
          method: 'POST',
          data: {
            page: nextPage,
            limit: 10,
            incident_type: 'vulnerability',
            statuses: [statusMap[status as keyof typeof statusMap]],
          },
        },
        (response) => {
          if (response) {
            setters[status]((prev) => [...prev, ...response.data]);
            setPagination((prev) => ({
              ...prev,
              [status]: {
                page: response.current_page,
                totalPages: response.total_pages,
                totalCount: response.total_count,
                loading: false,
              },
            }));
          } else {
            setPagination((prev) => ({
              ...prev,
              [status]: { ...prev[status], loading: false },
            }));
          }
        }
      );
    },
    [pagination, commonAPIRequest]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchIncidents = async () => {
      if (!commonAPIRequest) return;

      setIsLoading(true);
      setError(null);

      try {
        commonAPIRequest<ScaIncidentResponse>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'vulnerability', statuses: ['open'] },
          },
          (response) => {
            if (response) {
              setOpenIncidents(response.data);
              setPagination((prev) => ({
                ...prev,
                open: {
                  page: response.current_page,
                  totalPages: response.total_pages,
                  totalCount: response.total_count,
                  loading: false,
                },
              }));
            }
          }
        );

        commonAPIRequest<ScaIncidentResponse>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'vulnerability', statuses: ['in-progress'] },
          },
          (response) => {
            if (response) {
              setInProgressIncidents(response.data);
              setPagination((prev) => ({
                ...prev,
                inProgress: {
                  page: response.current_page,
                  totalPages: response.total_pages,
                  totalCount: response.total_count,
                  loading: false,
                },
              }));
            }
          }
        );

        commonAPIRequest<ScaIncidentResponse>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'vulnerability', statuses: ['closed'] },
          },
          (response) => {
            if (response) {
              setClosedIncidents(response.data);
              setPagination((prev) => ({
                ...prev,
                closed: {
                  page: response.current_page,
                  totalPages: response.total_pages,
                  totalCount: response.total_count,
                  loading: false,
                },
              }));
            }
          }
        );
      } catch (err) {
        setError('Failed to fetch vulnerability incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const getColumnFromId = (id: number | string): string => {
    if (id === 'open' || openIncidents.some((incident) => incident.id === id)) return 'open';
    if (id === 'inProgress' || inProgressIncidents.some((incident) => incident.id === id))
      return 'inProgress';
    if (id === 'closed' || closedIncidents.some((incident) => incident.id === id)) return 'closed';
    return '';
  };

  const updateIncidentStatus = async (incidentId: number, status: string) => {
    if (!commonAPIRequest) return;

    commonAPIRequest(
      {
        api:
          createEndpointUrl(API_ENDPOINTS.incidents.updateIncidentStatus) +
          incidentId +
          '/status?status=' +
          status,
        method: API_ENDPOINTS.incidents.updateIncidentStatus.method,
        data: { status },
      },
      () => {}
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const sourceColumn = getColumnFromId(Number(active.id));
    setActiveId(Number(active.id));
    setActiveColumn(sourceColumn);
    setSourceColumn(sourceColumn);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeColumn) return;

    const overId = over.id;
    const targetColumn = getColumnFromId(overId);

    if (!targetColumn) return;

    if (activeColumn !== targetColumn) {
      const targetIndex = getIncidentsList(targetColumn).findIndex(
        (incident) => incident.id === overId
      );
      moveIncident(
        Number(active.id),
        activeColumn,
        targetColumn,
        targetIndex !== -1 ? targetIndex : undefined
      );
      setActiveColumn(targetColumn);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      let targetColumn;
      if (over.data.current?.type === 'column') {
        targetColumn = over.id as string;
      } else {
        if (openIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'open';
        } else if (inProgressIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'inProgress';
        } else if (closedIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'closed';
        }
      }

      const previousColumn = sourceColumn;

      if (targetColumn && previousColumn && targetColumn !== previousColumn) {
        const targetIndex = getIncidentsList(targetColumn).findIndex(
          (incident) => incident.id === over.id
        );

        moveIncident(
          Number(active.id),
          previousColumn,
          targetColumn,
          targetIndex !== -1 ? targetIndex : undefined
        );

        updateIncidentStatus(
          Number(active.id),
          targetColumn === 'closed'
            ? 'closed'
            : targetColumn === 'inProgress'
              ? 'in-progress'
              : 'open'
        );
      }
    }

    setActiveId(null);
    setActiveColumn(null);
  };

  const getAllIncidents = () => [...openIncidents, ...inProgressIncidents, ...closedIncidents];

  const debouncedSearch = debounce((term: string) => {
    setSearch(term);

    setPagination((prev) => ({
      open: { ...prev.open, page: 1 },
      inProgress: { ...prev.inProgress, page: 1 },
      closed: { ...prev.closed, page: 1 },
    }));

    if (commonAPIRequest) {
      ['open', 'inProgress', 'closed'].forEach((status) => {
        const setters = {
          open: setOpenIncidents,
          inProgress: setInProgressIncidents,
          closed: setClosedIncidents,
        };

        const statusMap = {
          open: 'open',
          inProgress: 'in-progress',
          closed: 'closed',
        };

        commonAPIRequest<ScaIncidentResponse>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: {
              page: 1,
              limit: 10,
              incident_type: 'vulnerability',
              search: term,
              statuses: [statusMap[status as keyof typeof statusMap]],
            },
          },
          (response) => {
            if (response) {
              setters[status](response.data);
              setPagination((prev) => ({
                ...prev,
                [status]: {
                  page: response.current_page,
                  totalPages: response.total_pages,
                  totalCount: response.total_count,
                  loading: false,
                },
              }));
            }
          }
        );
      });
    }
  }, 300);

  const handleFiltersChange = useCallback(
    (filters: Record<string, any>) => {
      setActiveFilters(filters);

      setPagination((prev) => ({
        open: { ...prev.open, page: 1 },
        inProgress: { ...prev.inProgress, page: 1 },
        closed: { ...prev.closed, page: 1 },
      }));

      if (commonAPIRequest) {
        ['open', 'inProgress', 'closed'].forEach((status) => {
          const setters = {
            open: setOpenIncidents,
            inProgress: setInProgressIncidents,
            closed: setClosedIncidents,
          };

          const statusMap = {
            open: 'open',
            inProgress: 'in-progress',
            closed: 'closed',
          };

          const filterData = {
            page: 1,
            limit: 10,
            incident_type: 'vulnerability',
            search,
            statuses: [statusMap[status as keyof typeof statusMap]],
            ...Object.entries(filters).reduce(
              (acc, [key, value]) => {
                if (Array.isArray(value)) {
                  acc[key] = value.map((item) => (item.id ? item.id : item.value));
                } else if (value?.value) {
                  acc[key] = value.value;
                } else if (value) {
                  acc[key] = value;
                }
                return acc;
              },
              {} as Record<string, any>
            ),
          };

          commonAPIRequest<ScaIncidentResponse>(
            {
              api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
              method: 'POST',
              data: filterData,
            },
            (response) => {
              if (response) {
                setters[status](response.data);
                setPagination((prev) => ({
                  ...prev,
                  [status]: {
                    page: response.current_page,
                    totalPages: response.total_pages,
                    totalCount: response.total_count,
                    loading: false,
                  },
                }));
              }
            }
          );
        });
      }
    },
    [commonAPIRequest, search]
  );

  const EmptyState = ({ columnTitle }: { columnTitle: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-4" />
      <h3 className="font-medium mb-2">No Vulnerabilities</h3>
      <p className="text-sm">No {columnTitle.toLowerCase()} vulnerability incidents found.</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 container mx-auto p-4">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 p-4 rounded-lg">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vulnerability incidents..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-8"
          />
          {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
        </div>

        <ScaIncidentFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={activeFilters}
          commonAPIRequest={commonAPIRequest}
        />
      </div>

      <div className="flex-1 flex items-start justify-start overflow-x-auto custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6">
            <ScaIncidentColumn
              column={{
                id: 'open',
                title: 'Open',
                items: openIncidents,
                totalCount: pagination.open.totalCount,
              }}
              onLoadMore={() => loadMoreIncidents('open')}
              hasMore={pagination.open.page < pagination.open.totalPages}
              isLoading={pagination.open.loading}
            >
              <SortableContext
                items={openIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {openIncidents.length > 0 ? (
                  openIncidents.map((incident) => (
                    <ScaSortableIncidentCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="Open" />
                )}
              </SortableContext>
            </ScaIncidentColumn>

            <ScaIncidentColumn
              column={{
                id: 'inProgress',
                title: 'In Progress',
                items: inProgressIncidents,
                totalCount: pagination.inProgress.totalCount,
              }}
              onLoadMore={() => loadMoreIncidents('inProgress')}
              hasMore={pagination.inProgress.page < pagination.inProgress.totalPages}
              isLoading={pagination.inProgress.loading}
            >
              <SortableContext
                items={inProgressIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {inProgressIncidents.length > 0 ? (
                  inProgressIncidents.map((incident) => (
                    <ScaSortableIncidentCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="In Progress" />
                )}
              </SortableContext>
            </ScaIncidentColumn>

            <ScaIncidentColumn
              column={{
                id: 'closed',
                title: 'Closed',
                items: closedIncidents,
                totalCount: pagination.closed.totalCount,
              }}
              onLoadMore={() => loadMoreIncidents('closed')}
              hasMore={pagination.closed.page < pagination.closed.totalPages}
              isLoading={pagination.closed.loading}
            >
              <SortableContext
                items={closedIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {closedIncidents.length > 0 ? (
                  closedIncidents.map((incident) => (
                    <ScaSortableIncidentCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="Closed" />
                )}
              </SortableContext>
            </ScaIncidentColumn>
          </div>

          <DragOverlay>
            {activeId ? (
              <ScaIncidentTaskCard
                incident={getAllIncidents().find((incident) => incident.id === activeId)!}
                dragHandleProps={{}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default withAPIRequest(ScaIncidentsKanbanBoard);
