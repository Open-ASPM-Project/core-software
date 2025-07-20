import type { FC, ChangeEvent } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
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
  Package,
  AlertTriangle,
  AlertCircle,
  Search,
  Globe,
  CheckCircle,
  FileText,
  Gauge,
  LinkIcon,
  FileCode,
  Bug,
  FileWarning,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import debounce from 'lodash/debounce';

interface Vulnerability {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  package_version: string;
  vulnerability_type: string;
  vulnerability_id: string;
  description: string;
  artifact_type: string;
  artifact_path: string;
  cvss_base_score: number;
  cvss_impact_score: number;
  cvss_exploitability_score: number;
  fix_available: boolean;
  cve_id: string;
  cve_urls: string[];
  vulnerability_urls: string[];
  score_normalized: number;
  created_at: string;
  repository_id: number;
  whitelisted: boolean;
}

interface PaginatedResponse {
  data: Vulnerability[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

type CommonAPIRequest = <T>(
  requestParams: {
    api: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: Record<string, unknown>;
    data?: Record<string, unknown>;
  },
  callback: (response: T | null) => void
) => void;

interface ViewVulnerabilitiesForPRScansDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prTitle: string;
  prId: number;
  repoId: number;
  commonAPIRequest?: CommonAPIRequest;
}

const LoadingSkeleton: FC = () => (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: FC = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
    <p className="text-lg font-medium text-muted-foreground">No vulnerabilities found</p>
    <p className="text-sm text-muted-foreground/70 mt-1">
      This pull request has no detected vulnerabilities
    </p>
  </div>
);

const getSeverityColor = (severity: string): string => {
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

const ViewVulnerabilitiesForPRScansDialog: FC<ViewVulnerabilitiesForPRScansDialogProps> = ({
  isOpen,
  onClose,
  prTitle,
  prId,
  repoId,
  commonAPIRequest,
}) => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchVulnerabilities = useCallback(
    (page: number, search: string = '') => {
      if ((!hasMore && page > 1) || !commonAPIRequest) return;

      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.repository.getRepositoryVulnerabilities;
      const apiUrl = createEndpointUrl(endpoint);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

      commonAPIRequest<PaginatedResponse>(
        {
          api: `${apiUrl}`,
          method: 'POST',
          data: {
            repo_ids: [repoId],
            pr_ids: [prId],
            page: page,
            ...(search ? { search: search } : {}),
          },
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setVulnerabilities((prev) =>
              page === 1 ? response.data : [...prev, ...response.data]
            );
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
      setVulnerabilities([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchVulnerabilities(1, query);
    }, 500),
    [fetchVulnerabilities]
  );

  useEffect(() => {
    if (isOpen && repoId && prId) {
      setVulnerabilities([]);
      setCurrentPage(1);
      setHasMore(true);
      setSearchQuery('');
      fetchVulnerabilities(1);
    }
  }, [isOpen, repoId, prId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          fetchVulnerabilities(currentPage + 1, searchQuery);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore, currentPage, fetchVulnerabilities, searchQuery]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Rest of your JSX remains the same but with proper TypeScript typing
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-6 max-w-4xlp-6 rounded-t-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-600/20 dark:to-red-600/20 border-b border-orange-100 dark:border-orange-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <GitPullRequest className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <DialogTitle>Vulnerabilities Found in PR: {prTitle}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Shield className="h-4 w-4" />
                <span>{vulnerabilities.length} vulnerabilities detected</span>
              </div>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vulnerabilities..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-8 focus:!ring-0 focus:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 max-w-4xl">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[calc(80vh-180px)]">
            {vulnerabilities.length === 0 && !isLoading ? (
              <EmptyState />
            ) : (
              <div className="space-y-4 pr-4">
                {vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Bug className="h-3.5 w-3.5" />
                            {vuln.vulnerability_id}
                          </Badge>
                          {vuln.cve_id && (
                            <Badge variant="outline" className="gap-1">
                              <FileWarning className="h-3.5 w-3.5" />
                              {vuln.cve_id}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`gap-1 ${getSeverityColor(vuln.severity)}`}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {vuln.severity.toUpperCase()}
                          </Badge>
                          {vuln.fix_available && (
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="h-3.5 w-3.5" />
                              Fix Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Score: {Math.round(vuln.score_normalized)}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4">{vuln.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vuln.package}</span>
                          <span className="text-muted-foreground">v{vuln.package_version}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vuln.artifact_path}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vuln.artifact_type}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">CVSS Scores:</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Base: {vuln.cvss_base_score}</span>
                          <span>•</span>
                          <span>Impact: {vuln.cvss_impact_score}</span>
                          <span>•</span>
                          <span>Exploitability: {vuln.cvss_exploitability_score}</span>
                        </div>
                        {vuln.vulnerability_urls.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={vuln.vulnerability_urls[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              View Details
                              <LinkIcon className="h-3 w-3" />
                            </a>
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

export default withAPIRequest(ViewVulnerabilitiesForPRScansDialog);
