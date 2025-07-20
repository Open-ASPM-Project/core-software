import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Input } from '@/components/ui/input';
import {
  GitPullRequest,
  Shield,
  FileText,
  GitCommit,
  Users,
  Mail,
  Key,
  Hash,
  File,
  AlertTriangle,
  AlertCircle,
  Search,
  MessageCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import debounce from 'lodash/debounce';

interface Secret {
  id: number;
  line: string;
  fingerprint: string;
  secret: string;
  match: string;
  file: string;
  commit: string;
  message: string;
  author: string;
  email: string;
  date: string;
  severity: string;
  description: string;
  rule: string;
  score_normalized: number;
  created_at: string;
  pull_request: {
    title: string;
    number: number;
    url: string;
    author: string;
  };
}

interface ViewSecretsForPRScansDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prTitle: string;
  prId: number;
  repoId: number;
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
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-full mt-4" />
        <div className="flex flex-col gap-2 bg-muted/50 rounded-md p-3 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
    <p className="text-lg font-medium text-muted-foreground">No secrets found</p>
    <p className="text-sm text-muted-foreground/70 mt-1">
      This pull request has no detected secrets
    </p>
  </div>
);

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const ViewSecretsForPRScansDialog: React.FC<ViewSecretsForPRScansDialogProps> = ({
  isOpen,
  onClose,
  prTitle,
  prId,
  repoId,
  commonAPIRequest,
}) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  console.log('prId', prId);

  const fetchSecrets = useCallback(
    (page: number, search: string = '') => {
      if (!hasMore && page > 1) return;

      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.repository.getRepositorySecrets;
      const apiUrl = createEndpointUrl(endpoint);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

      commonAPIRequest<{
        data: Secret[];
        current_page: number;
        total_pages: number;
        total_count: number;
      }>(
        {
          api: `${apiUrl}`,
          method: 'POST',
          data: {
            repo_ids: [repoId],
            page: page,
            ...(search ? { search: search } : {}),
            pr_ids: [prId],
          },
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setSecrets((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
            setHasMore(response.current_page < response.total_pages);
            setCurrentPage(response.current_page);
          }
        }
      );
    },
    [repoId, prId, commonAPIRequest, hasMore]
  );

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSecrets([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchSecrets(1, query);
    }, 500),
    [fetchSecrets]
  );

  useEffect(() => {
    if (isOpen && repoId && prId) {
      setSecrets([]);
      setCurrentPage(1);
      setHasMore(true);
      setSearchQuery('');
      fetchSecrets(1);
    }
  }, [isOpen, repoId, prId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          fetchSecrets(currentPage + 1, searchQuery);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore, currentPage, fetchSecrets, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 
          dark:from-emerald-600/20 dark:to-blue-600/20 
          border-b border-emerald-100 dark:border-emerald-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <GitPullRequest className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <DialogTitle>Secrets Found in PR: {prTitle}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Shield className="h-4 w-4" />
                <span>{secrets.length} secrets detected</span>
              </div>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search secrets..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-8 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[calc(80vh-180px)]">
            {secrets.length === 0 && !isLoading ? (
              <EmptyState />
            ) : (
              <div className="space-y-4 pr-4">
                {secrets.map((secret) => (
                  <div key={secret.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{secret.file}</span>
                          <span className="text-sm text-muted-foreground">Line: {secret.line}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="gap-1">
                            <Key className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">{secret.secret}</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getSeverityColor(secret.severity)} gap-1`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {secret.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(secret.created_at).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <Hash className="h-3 w-3" />
                          Score: {Math.ceil(secret.score_normalized)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <File className="h-4 w-4 text-muted-foreground mt-1" />
                        <p className="text-muted-foreground">{secret.description}</p>
                      </div>

                      <div className="flex flex-col gap-2 bg-muted/50 rounded-md p-3">
                        {secret.commit && (
                          <div className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{secret.commit}</span>
                          </div>
                        )}
                        {secret.author && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{secret.author}</span>
                          </div>
                        )}
                        {secret.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{secret.email}</span>
                          </div>
                        )}
                        {secret.message && (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{secret.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {hasMore && <div ref={observerTarget} className="h-4" />}
                {isLoading && <LoadingSkeleton />}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(ViewSecretsForPRScansDialog);
