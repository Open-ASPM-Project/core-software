import React from 'react';
import { format } from 'date-fns';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Loader2, AlertCircle, MessageSquareOff } from 'lucide-react';
import { toast } from 'sonner';

interface CommentItem {
  content: string;
  incident_id: number;
  id: number;
  user_id: number;
  created_at: string;
}

interface CommentsResponse {
  data: CommentItem[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface CommentsSectionProps {
  incidentId: number;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ incidentId, commonAPIRequest }) => {
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [comments, setComments] = React.useState<CommentItem[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchComments = React.useCallback(
    (page: number) => {
      const endpoint = API_ENDPOINTS.incidents.getComments;
      const api = createEndpointUrl(endpoint);

      const isInitialFetch = page === 1;
      if (isInitialFetch) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      commonAPIRequest(
        {
          api: `${api}${incidentId}/comments`,
          method: endpoint.method,
          params: { page, limit: 10 },
        },
        (response: CommentsResponse | null) => {
          if (isInitialFetch) {
            setIsLoading(false);
          } else {
            setIsFetchingMore(false);
          }

          if (response) {
            setComments((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
            setHasMore(response.current_page < response.total_pages);
            setCurrentPage(response.current_page);
          } else {
            setError('Failed to load comments');
          }
        }
      );
    },
    [incidentId, commonAPIRequest]
  );

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const endpoint = API_ENDPOINTS.incidents.addComment;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: `${api}`,
        method: endpoint.method,
        data: {
          content: newComment,
          incident_id: incidentId,
        },
      },
      (response) => {
        setIsSubmitting(false);
        if (response) {
          setNewComment('');
          fetchComments(1); // Refresh comments
          toast.success('Comment added successfully');
        } else {
          toast.error('Failed to add comment');
        }
      }
    );
  };

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
          fetchComments(currentPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, currentPage, isFetchingMore, isLoading, fetchComments]);

  React.useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  if (isLoading) return <CommentsSkeleton />;

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 border border-dashed border-blue-200/50 dark:border-blue-800/30">
            <MessageSquareOff className="w-12 h-12 text-blue-400/50 dark:text-blue-600/50 mb-3 animate-pulse" />
            <p className="text-lg font-medium text-blue-600/70 dark:text-blue-400/70 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              No comments yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="group flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100/50 dark:border-blue-800/30 hover:shadow-md transition-all duration-200"
              >
                <Avatar className="w-10 h-10 border-2 border-blue-200/50 dark:border-blue-700/50">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300">
                    {comment.user_id}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      User {comment.user_id}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {format(new Date(comment.created_at), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={loadMoreRef} className="mt-4">
          {isFetchingMore && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="flex gap-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            className="min-h-[80px] bg-white/50 dark:bg-slate-950/50 resize-none"
          />
          <Button
            className="self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            onClick={submitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CommentsSkeleton = () => (
  <div className="p-6 space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default withAPIRequest(CommentsSection);
