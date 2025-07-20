import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitFork,
  Code,
  Calendar,
  Timer,
  Eye,
  Star,
  CircleDot,
  GitPullRequest,
  User,
  Loader2,
  SearchX,
  Link2,
  Scale,
  Calendar as CalendarIcon,
  Lock,
  Unlock,
} from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { format } from 'date-fns';
import gitlabLogo from '../../../../../assets/images/gitlab.png';
import githubLogo from '../../../../../assets/images/github.png';
import bitbucketLogo from '../../../../../assets/images/bitbucket.png';

const ViewRepositoriesForGroupDialog = ({ open, onOpenChange, groupId, commonAPIRequest }) => {
  const [repositories, setRepositories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRepositories = React.useCallback(() => {
    const endpoint = API_ENDPOINTS.group.getGroupRepositories;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: api + groupId + '/repos',
        method: endpoint.method,
        params: { id: groupId },
      },
      (response) => {
        setLoading(false);
        if (response) {
          setRepositories(response.repos);
        }
      }
    );
  }, [groupId, commonAPIRequest]);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      fetchRepositories();
    }
  }, [open, fetchRepositories]);

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Loading repositories...</p>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <SearchX className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-lg font-medium text-muted-foreground">No repositories found</p>
      <p className="text-sm text-muted-foreground/70 mt-1">This group has no repositories.</p>
    </div>
  );

  const formatSize = (bytes) => {
    const kb = bytes * 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:to-purple-600/20 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <GitFork className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle>Group Repositories</DialogTitle>
              <DialogDescription>View all repositories in this group</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[600px] p-6">
          {loading ? (
            <LoadingState />
          ) : repositories.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 
                           border border-slate-200 dark:border-slate-700 rounded-lg p-4 
                           hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            repo?.vc_type === 'gitlab'
                              ? gitlabLogo
                              : repo?.vc_type === 'github'
                                ? githubLogo
                                : bitbucketLogo
                          }
                          alt={repo.author}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${repo.author}&background=random`;
                          }}
                        />
                        <div className="flex-grow">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold">{repo.name}</h3>
                              {(repo.vc_type === 'github' && repo.other_repo_details.private) ||
                              (repo.vc_type === 'gitlab' &&
                                repo.other_repo_details.visibility === 'private') ||
                              (repo.vc_type === 'bitbucket' &&
                                repo.other_repo_details.is_private) ? (
                                <Lock className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Unlock className="w-4 h-4 text-green-500" />
                              )}
                              <div
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  (repo.vc_type === 'github' && !repo.other_repo_details.private) ||
                                  (repo.vc_type === 'gitlab' &&
                                    repo.other_repo_details.visibility === 'public') ||
                                  (repo.vc_type === 'bitbucket' &&
                                    !repo.other_repo_details.is_private)
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
                                {(repo.vc_type === 'github' && !repo.other_repo_details.private) ||
                                (repo.vc_type === 'gitlab' &&
                                  repo.other_repo_details.visibility === 'public') ||
                                (repo.vc_type === 'bitbucket' &&
                                  !repo.other_repo_details.is_private)
                                  ? 'public'
                                  : 'private'}
                              </div>
                              <div className="text-sm text-slate-500">{repo.vc_type}</div>
                            </div>
                            <a
                              href={
                                repo.repoUrl.endsWith('.git')
                                  ? repo?.repoUrl.slice(0, -4)
                                  : repo?.repoUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                            >
                              <Link2 className="w-4 h-4 text-slate-500" />
                            </a>
                          </div>
                          {repo.other_repo_details.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {repo.other_repo_details.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {repo.vc_type === 'github' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500" />
                              {repo.other_repo_details.stargazers_count} stars
                            </div>
                            <div className="flex items-center gap-2">
                              <GitFork className="w-4 h-4 text-blue-500" />
                              {repo.other_repo_details.forks_count} forks
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-purple-500" />
                              {repo.other_repo_details.watchers_count} watching
                            </div>
                            <div className="flex items-center gap-2">
                              <GitPullRequest className="w-4 h-4 text-green-500" />
                              {repo.other_repo_details.open_issues_count} issues
                            </div>
                          </>
                        )}
                        {repo.vc_type === 'gitlab' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500" />
                              {repo.other_repo_details.star_count} stars
                            </div>
                            <div className="flex items-center gap-2">
                              <GitFork className="w-4 h-4 text-blue-500" />
                              {repo.other_repo_details.forks_count} forks
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {repo.other_repo_details.language && (
                          <div className="flex items-center gap-2">
                            <CircleDot className="w-3 h-3 text-violet-500" />
                            {repo.other_repo_details.language}
                          </div>
                        )}
                        {repo.other_repo_details.size > 0 && (
                          <div className="flex items-center gap-2">
                            <Scale className="w-3 h-3" />
                            {formatSize(repo.other_repo_details.size)}
                          </div>
                        )}
                        {repo.created_at && (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" />
                            Created {format(new Date(repo.created_at), 'PP')}
                          </div>
                        )}
                        {((repo.vc_type === 'github' && repo.other_repo_details.updated_at) ||
                          (repo.vc_type === 'gitlab' && repo.other_repo_details.last_activity_at) ||
                          (repo.vc_type === 'bitbucket' && repo.other_repo_details.updated_on)) && (
                          <div className="flex items-center gap-2">
                            <Timer className="w-3 h-3" />
                            Updated{' '}
                            {format(
                              new Date(
                                repo.vc_type === 'github'
                                  ? repo.other_repo_details.updated_at
                                  : repo.vc_type === 'gitlab'
                                    ? repo.other_repo_details.last_activity_at
                                    : repo.other_repo_details.updated_on
                              ),
                              'PP'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(ViewRepositoriesForGroupDialog);
