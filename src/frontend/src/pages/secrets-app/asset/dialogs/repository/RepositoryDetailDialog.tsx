import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import {
  GitFork,
  AlertCircle,
  Link2,
  Calendar,
  Star,
  Eye,
  GitBranch,
  Scale,
  Shield,
  Database,
  ArrowUpRightFromSquare,
  Lock,
  Unlock,
  CircleDot,
  Languages,
  Loader2,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-sm text-muted-foreground">Loading repository details...</p>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <Alert variant="destructive" className="m-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

const RepositoryDetailDialog = ({ open, onOpenChange, repoId, commonAPIRequest }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [repoDetail, setRepoDetail] = React.useState(null);

  const fetchRepoDetails = React.useCallback(() => {
    if (!repoId) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.repository.getRepositoryDetails;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: api + repoId,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setRepoDetail(response);
        } else {
          setError('Failed to fetch repository details');
        }
      }
    );
  }, [repoId, commonAPIRequest]);

  React.useEffect(() => {
    if (open) {
      fetchRepoDetails();
    } else {
      setRepoDetail(null);
      setError(null);
    }
  }, [open, fetchRepoDetails]);

  const getRepoStats = () => {
    const stats = {
      stars: 0,
      forks: 0,
      watchers: 0,
      isPrivate: false,
      defaultBranch: 'main',
      language: '',
      size: 0,
    };

    if (!repoDetail) return stats;

    const details = repoDetail.other_repo_details;

    switch (repoDetail.vctype) {
      case 'github':
        stats.stars = details.stargazers_count;
        stats.forks = details.forks_count;
        stats.watchers = details.watchers_count;
        stats.isPrivate = details.private;
        stats.defaultBranch = details.default_branch;
        stats.language = details.language;
        stats.size = details.size;
        break;

      case 'gitlab':
        stats.stars = details.star_count;
        stats.forks = details.forks_count;
        stats.watchers = 0; // Not available in GitLab
        stats.isPrivate = details.visibility === 'private';
        stats.defaultBranch = details.default_branch;
        stats.language = ''; // Not directly available in GitLab API
        stats.size = 0; // Not available in GitLab API
        break;

      case 'bitbucket':
        stats.stars = 0; // Not available in Bitbucket
        stats.forks = 0; // Would need separate API call
        stats.watchers = 0; // Would need separate API call
        stats.isPrivate = details.is_private;
        stats.defaultBranch = details.mainbranch?.name;
        stats.language = details.language;
        stats.size = details.size;
        break;
    }

    return stats;
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!repoDetail) return null;

  const stats = getRepoStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-600/20 dark:to-indigo-600/20 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <GitFork className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{repoDetail.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {stats.isPrivate ? (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Unlock className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono">
                  <GitBranch className="w-3 h-3 mr-1" />
                  {stats.defaultBranch}
                </Badge>
                <Badge variant="outline">{repoDetail.vctype}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a
                href={
                  repoDetail.repoUrl.endsWith('.git')
                    ? repoDetail.repoUrl.slice(0, -4)
                    : repoDetail.repoUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 className="w-4 h-4 mr-2" />
                View Repository
                <ArrowUpRightFromSquare className="w-3 h-3 ml-2" />
              </a>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="p-6 space-y-6">
            {/* Description & Stats */}
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {repoDetail.other_repo_details.description || 'No description provided'}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {stats.stars > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-lg font-semibold">{stats.stars}</p>
                      <p className="text-xs text-muted-foreground">Stars</p>
                    </div>
                  </div>
                )}
                {stats.forks > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <GitFork className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-lg font-semibold">{stats.forks}</p>
                      <p className="text-xs text-muted-foreground">Forks</p>
                    </div>
                  </div>
                )}
                {stats.watchers > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-lg font-semibold">{stats.watchers}</p>
                      <p className="text-xs text-muted-foreground">Watchers</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Technical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-500" />
                Technical Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Primary Language</span>
                  </div>
                  <p>{stats.language || 'Not specified'}</p>
                </div>
                {stats.size > 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">Repository Size</span>
                    </div>
                    <p>{Math.round(stats.size / 1024)} MB</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Repository Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Repository Classification
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <CircleDot className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Risk Score</p>
                      <p className="text-lg font-semibold">
                        {Math.round(repoDetail.score_normalized)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Timeline
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  {repoDetail.created_at && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Created</p>
                      <p className="text-sm">{format(new Date(repoDetail.created_at), 'PPp')}</p>
                    </div>
                  )}
                  {repoDetail.updated_at && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Last Updated</p>
                      <p className="text-sm">{format(new Date(repoDetail.updated_at), 'PPp')}</p>
                    </div>
                  )}
                  {repoDetail.lastScanDate && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Last Scanned</p>
                      <p className="text-sm">{format(new Date(repoDetail.lastScanDate), 'PPp')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(RepositoryDetailDialog);
