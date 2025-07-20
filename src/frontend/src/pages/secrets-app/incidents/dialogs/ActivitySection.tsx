import React from 'react';
import { format } from 'date-fns';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Activity,
  Shield,
  UserCheck,
  RefreshCcw,
  Loader2,
} from 'lucide-react';

interface ActivityItem {
  action: string;
  id: number;
  new_value: string;
  incident_id: number;
  comment_id: number | null;
  old_value: string | null;
  created_at: string;
  user_id: number | null;
}

interface ActivityResponse {
  data: ActivityItem[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface ActivitySectionProps {
  incidentId: number;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'incident opened':
      return <AlertCircle className="w-4 h-4 text-green-500" />;
    case 'incident closed':
      return <Shield className="w-4 h-4 text-red-500" />;
    case 'incident in-process':
      return <RefreshCcw className="w-4 h-4 text-amber-500" />;
    case 'severity updated':
      return <Activity className="w-4 h-4 text-purple-500" />;
    default:
      return <Activity className="w-4 h-4 text-blue-500" />;
  }
};

const ActivitySection: React.FC<ActivitySectionProps> = ({ incidentId, commonAPIRequest }) => {
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchActivities = React.useCallback(
    (page: number) => {
      const endpoint = API_ENDPOINTS.incidents.getActivity;
      const api = createEndpointUrl(endpoint);

      const isInitialFetch = page === 1;
      if (isInitialFetch) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      commonAPIRequest(
        {
          api: `${api}${incidentId}/activities`,
          method: endpoint.method,
          params: { page, limit: 10 },
        },
        (response: ActivityResponse | null) => {
          if (isInitialFetch) {
            setIsLoading(false);
          } else {
            setIsFetchingMore(false);
          }

          if (response) {
            setActivities((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
            setHasMore(response.current_page < response.total_pages);
            setCurrentPage(response.current_page);
          } else {
            setError('Failed to load activities');
          }
        }
      );
    },
    [incidentId, commonAPIRequest]
  );

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
          fetchActivities(currentPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, currentPage, isFetchingMore, isLoading, fetchActivities]);

  React.useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  if (isLoading) return <ActivitySkeleton />;

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-8 pb-6 last:pb-0">
              <div className="absolute left-0 w-8 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-background border-2 border-primary" />
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {getActionIcon(activity.action)}
                  <span className="font-medium capitalize">{activity.action}</span>
                </div>
                {activity.old_value && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{activity.old_value}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{activity.new_value}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(activity.created_at), 'PPp')}
                  {activity.user_id && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <UserCheck className="w-3.5 h-3.5" />
                      User ID: {activity.user_id}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={loadMoreRef} className="mt-4">
        {isFetchingMore && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

const ActivitySkeleton = () => (
  <div className="p-6 space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="pl-8">
        <Skeleton className="h-24 w-full" />
      </div>
    ))}
  </div>
);

export default withAPIRequest(ActivitySection);
