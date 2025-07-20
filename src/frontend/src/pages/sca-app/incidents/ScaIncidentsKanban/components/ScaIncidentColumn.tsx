import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScaIncident } from '../hooks/useScaKanban';

interface ScaIncidentColumn {
  id: string;
  title: string;
  items: ScaIncident[];
  totalCount?: number;
}

interface ScaIncidentColumnProps {
  column: ScaIncidentColumn;
  children: React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const ScaIncidentColumn = ({
  column,
  children,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ScaIncidentColumnProps) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore?.();
        }
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [isLoading, hasMore, onLoadMore]);

  const getColumnColors = (columnId: string) => {
    switch (columnId) {
      case 'open':
        return {
          gradient:
            'from-red-500/5 via-rose-500/5 to-pink-500/5 dark:from-red-500/10 dark:via-rose-500/10 dark:to-pink-500/10',
          text: 'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          hover: 'hover:bg-red-500/10 dark:hover:bg-red-500/20',
        };
      case 'inProgress':
        return {
          gradient:
            'from-purple-500/5 via-violet-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:via-violet-500/10 dark:to-indigo-500/10',
          text: 'from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400',
          badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          icon: 'text-purple-600 dark:text-purple-400',
          hover: 'hover:bg-purple-500/10 dark:hover:bg-purple-500/20',
        };
      case 'closed':
        return {
          gradient:
            'from-emerald-500/5 via-green-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:via-green-500/10 dark:to-teal-500/10',
          text: 'from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400',
          badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          icon: 'text-emerald-600 dark:text-emerald-400',
          hover: 'hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
        };
      default:
        return {
          gradient: '',
          text: '',
          badge: '',
          icon: '',
          hover: '',
        };
    }
  };

  const colors = getColumnColors(column.id);

  return (
    <div
      ref={setNodeRef}
      className="bg-background/50 rounded-xl flex flex-col h-[calc(90vh-12rem)]"
    >
      <div className={`p-4 border-b border-border/40 bg-gradient-to-r ${colors.gradient}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2
              className={`font-semibold text-lg bg-gradient-to-r ${colors.text} bg-clip-text text-transparent`}
            >
              {column.title}
            </h2>
            <Badge
              variant="secondary"
              className={`rounded-full px-3 py-0.5 font-medium ${colors.badge}`}
            >
              {column.totalCount ?? column.items.length}
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea
        className={`custom-scrollbar h-[calc(100% - 4rem)] ${
          column.id === 'open'
            ? 'bg-red-50/50 dark:bg-red-950/10'
            : column.id === 'inProgress'
              ? 'bg-purple-50/50 dark:bg-purple-950/10'
              : 'bg-emerald-50/50 dark:bg-emerald-950/10'
        }`}
      >
        <div className="p-4">
          <div className="space-y-3">
            {children}
            {hasMore && (
              <div ref={observerTarget} className="h-8 w-full">
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground text-center">Load More Trigger</div>
                )}
              </div>
            )}
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-[200px] rounded-lg animate-pulse" />
                <Skeleton className="h-[200px] rounded-lg animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
