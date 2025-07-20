import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityIncident } from '../types';
import { Button } from '@/components/ui/button';

interface SecurityColumn {
  id: string;
  title: string;
  items: SecurityIncident[];
  totalCount?: number;
}

interface SecurityColumnProps {
  column: SecurityColumn;
  children: React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const SecurityColumn = ({
  column,
  children,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: SecurityColumnProps) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // Add console logs to debug
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Debug log
        // console.log('Intersection observed', {
        //   isIntersecting: entries[0].isIntersecting,
        //   isLoading,
        //   hasMore,
        // });

        if (entries[0].isIntersecting && !isLoading && hasMore) {
          // console.log('Triggering load more');
          onLoadMore?.();
        }
      },
      {
        root: null, // Important: this makes it use the viewport
        threshold: 0.1,
        rootMargin: '100px', // Give it some margin to trigger earlier
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      // console.log('Target element found, observing');
      observer.observe(currentTarget);
    } else {
      // console.log('No target element found');
    }

    return () => {
      if (currentTarget) {
        // console.log('Cleaning up observer');
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
            'from-blue-500/5 via-sky-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:via-sky-500/10 dark:to-cyan-500/10',
          text: 'from-blue-600 to-sky-600 dark:from-blue-400 dark:to-sky-400',
          badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          icon: 'text-blue-600 dark:text-blue-400',
          hover: 'hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
        };
      case 'inProgress':
        return {
          gradient:
            'from-amber-500/5 via-orange-500/5 to-yellow-500/5 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-yellow-500/10',
          text: 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400',
          badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          icon: 'text-amber-600 dark:text-amber-400',
          hover: 'hover:bg-amber-500/10 dark:hover:bg-amber-500/20',
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
      className="bg-background/50 rounded-xl flex flex-col h-[calc(90vh-12rem)] "
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
          {/* <Button variant="ghost" size="icon" className={`h-8 w-8 ${colors.hover}`}>
            <MoreHorizontal className={`h-5 w-5 ${colors.icon}`} />
          </Button> */}
        </div>
      </div>

      {/* Make ScrollArea height explicit */}
      <ScrollArea
        className={`custom-scrollbar h-[calc(100% - 4rem)] ${
          column.id === 'open'
            ? 'bg-blue-50/50 dark:bg-blue-950/10'
            : column.id === 'inProgress'
              ? 'bg-amber-50/50 dark:bg-amber-950/10'
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
