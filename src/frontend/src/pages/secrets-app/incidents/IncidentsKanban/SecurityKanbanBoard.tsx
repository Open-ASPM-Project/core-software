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
import { SecurityColumn } from './components/SecurityColumn';
import { SortableSecurityCard } from './components/SortableSecurityCard';
import { SecurityTaskCard } from './components/SecurityTaskCard';
import { useSecurityKanban } from './hooks/useSecurityKanban';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { PaginatedResponse, SecurityIncident } from './types';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { IncidentFilters } from '../components/IncidentsFilters';

interface SecurityKanbanBoardProps {
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

const SecurityKanbanBoard = ({ commonAPIRequest }: SecurityKanbanBoardProps) => {
  const {
    openIncidents,
    inProgressIncidents,
    closedIncidents,
    setOpenIncidents,
    setInProgressIncidents,
    setClosedIncidents,
    moveIncident,
    getIncidentsList,
  } = useSecurityKanban();

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

  // Function to fetch more data for a specific column
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
            incident_type: 'secret',
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

  // Fetch initial data
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!commonAPIRequest) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch incidents for each status
        commonAPIRequest<PaginatedResponse<SecurityIncident>>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'secret', statuses: ['open'] },
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

        commonAPIRequest<PaginatedResponse<SecurityIncident>>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'secret', statuses: ['in-progress'] },
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

        commonAPIRequest<PaginatedResponse<SecurityIncident>>(
          {
            api: createEndpointUrl(API_ENDPOINTS.incidents.getIncidents),
            method: 'POST',
            data: { page: 1, limit: 10, incident_type: 'secret', statuses: ['closed'] },
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
        setError('Failed to fetch incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, [commonAPIRequest]);

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
      () => {
        // Status update handled by moveIncident
      }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const sourceColumn = getColumnFromId(Number(active.id));
    console.log('Drag Start:', {
      activeId: active.id,
      sourceColumn,
      openIds: openIncidents.map((i) => i.id),
      inProgressIds: inProgressIncidents.map((i) => i.id),
      closedIds: closedIncidents.map((i) => i.id),
    });

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
      // Determine target column
      let targetColumn;
      if (over.data.current?.type === 'column') {
        targetColumn = over.id as string;
      } else {
        // Check which column currently contains this item
        if (openIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'open';
        } else if (inProgressIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'inProgress';
        } else if (closedIncidents.some((inc) => inc.id === over.id)) {
          targetColumn = 'closed';
        }
      }

      // Get the source column from our stored state
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
      } else {
        console.log('No Move Required:', {
          reason: !targetColumn
            ? 'No target column identified'
            : !previousColumn
              ? 'No previous column identified'
              : 'Same column',
        });
      }
    }

    setActiveId(null);
    setActiveColumn(null);
  };

  const getAllIncidents = () => [...openIncidents, ...inProgressIncidents, ...closedIncidents];

  const debouncedSearch = debounce((term: string) => {
    setSearch(term);

    // Reset all columns to page 1
    setPagination((prev) => ({
      open: { ...prev.open, page: 1 },
      inProgress: { ...prev.inProgress, page: 1 },
      closed: { ...prev.closed, page: 1 },
    }));

    // Refetch all columns with search term
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
              incident_type: 'secret',
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

      // Reset pagination for all columns
      setPagination((prev) => ({
        open: { ...prev.open, page: 1 },
        inProgress: { ...prev.inProgress, page: 1 },
        closed: { ...prev.closed, page: 1 },
      }));

      // Refetch all columns with filters
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

          console.log('filters-secrets', filters);

          const filterData = {
            page: 1,
            limit: 10,
            incident_type: 'secret',
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
      <h3 className="font-medium mb-2">No Incidents</h3>
      <p className="text-sm">No {columnTitle.toLowerCase()} incidents found.</p>
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
    <div className="flex-1 container item-center mx-auto space-y-4 p-4  rounded-lg">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            defaultValue={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-8"
          />
          {isLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
        </div>

        <IncidentFilters
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
            <SecurityColumn
              column={{
                id: 'open',
                title: 'Open',
                items: openIncidents,
                totalCount: pagination.open.totalCount,
              }}
              onLoadMore={() => {
                console.log('Loading more open incidents...');
                loadMoreIncidents('open');
              }}
              hasMore={pagination.open.page < pagination.open.totalPages}
              isLoading={pagination.open.loading}
            >
              <SortableContext
                items={openIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {openIncidents.length > 0 ? (
                  openIncidents.map((incident) => (
                    <SortableSecurityCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="Open" />
                )}
              </SortableContext>
            </SecurityColumn>

            <SecurityColumn
              column={{
                id: 'inProgress',
                title: 'In Progress',
                items: inProgressIncidents,
                totalCount: pagination.inProgress.totalCount,
              }}
              onLoadMore={() => {
                console.log('Loading more in-progress incidents...');
                loadMoreIncidents('inProgress');
              }}
              hasMore={pagination.inProgress.page < pagination.inProgress.totalPages}
              isLoading={pagination.inProgress.loading}
            >
              <SortableContext
                items={inProgressIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {inProgressIncidents.length > 0 ? (
                  inProgressIncidents.map((incident) => (
                    <SortableSecurityCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="In Progress" />
                )}
              </SortableContext>
            </SecurityColumn>

            <SecurityColumn
              column={{
                id: 'closed',
                title: 'Closed',
                items: closedIncidents,
                totalCount: pagination.closed.totalCount,
              }}
              onLoadMore={() => {
                console.log('Loading more closed incidents...');
                loadMoreIncidents('closed');
              }}
              hasMore={pagination.closed.page < pagination.closed.totalPages}
              isLoading={pagination.closed.loading}
            >
              <SortableContext
                items={closedIncidents.map((incident) => incident.id)}
                strategy={verticalListSortingStrategy}
              >
                {closedIncidents.length > 0 ? (
                  closedIncidents.map((incident) => (
                    <SortableSecurityCard key={incident.id} incident={incident} />
                  ))
                ) : (
                  <EmptyState columnTitle="Closed" />
                )}
              </SortableContext>
            </SecurityColumn>
          </div>

          <DragOverlay>
            {activeId ? (
              <SecurityTaskCard
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

export default withAPIRequest(SecurityKanbanBoard);
