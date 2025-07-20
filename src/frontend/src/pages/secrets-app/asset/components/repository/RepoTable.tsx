import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  MoreVertical,
  GitFork,
  ChevronRight,
  CircleUser,
  ExternalLink,
  KeyRound,
  FolderPlus,
  X,
  FolderEdit,
  ChevronDown,
  SearchX,
  Calendar,
  Shield,
  GitBranch,
  Clock,
  Building2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAMPM } from '@/utils/commonFunctions';
import AddToNewGroupDialog from '../../dialogs/repository/AddToNewGroupDialog';
import AddToExistingGroupDialog from '../../dialogs/repository/AddToExistingGroupDialog';
import RepoPropertiesDialog from '../../dialogs/repository/RepoPropertiesDialog';
import ViewSecretsForRepoDialog from '../../dialogs/repository/ViewSecretsForRepoDialog';
import { toast } from 'sonner';
import { API_BASE_URLS } from '@/config/api.config';
import { useNavigate } from 'react-router-dom';
import RepositoryDetailDialog from '../../dialogs/repository/RepositoryDetailDialog';
import ViewRepoSBOMDialog from '../../dialogs/repository/ViewRepoSBOMDialog';
import AddAllowlistFromRepoDialog from '../../dialogs/repository/AddAllowlistFromRepoDialog';

// Types
interface SelectedRepo {
  id: number;
  name: string;
}

interface Repository {
  created_at: string | number | Date;
  repoUrl: string;
  secrets_count: number;
  author: string;
  score_normalized: number;
  id: number;
  name: string;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'secrets_count' | 'created_at' | 'score_normalized' | 'author';
}

const RepoTable = ({
  repositories,
  isLoading,
  limit,
  handleOrderChange,
  handleSortByChange,
  commonAPIRequest,
}: {
  isLoading: boolean;
  repositories: Repository[] | [];
  limit: number;
  handleOrderChange: () => void;
  handleSortByChange: (field: QueryParams['sort_by']) => void;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}) => {
  const navigate = useNavigate();
  const [selectedGroupRepos, setSelectedGroupRepos] = React.useState<SelectedRepo[]>([]);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const [selectedRows, setSelectedRows] = React.useState<SelectedRepo[]>([]);
  const [isNewGroupDialogOpen, setIsNewGroupDialogOpen] = React.useState(false);
  const [isExistingGroupDialogOpen, setIsExistingGroupDialogOpen] = React.useState(false);

  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = React.useState(false);
  const [selectedRepo, setSelectedRepo] = React.useState<{ id: number; name: string } | null>(null);
  const [isRepoDetailDialogOpen, setIsRepoDetailDialogOpen] = React.useState(false);
  const [isSBOMDialogOpen, setIsSBOMDialogOpen] = React.useState(false);
  const [isAllowlistDialogOpen, setIsAllowlistDialogOpen] = React.useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageRepos =
        repositories?.map((repo) => ({
          id: repo.id,
          name: repo.name,
        })) || [];

      const existingIds = new Set(selectedRows.map((row) => row.id));

      const newSelections = currentPageRepos.filter((repo) => !existingIds.has(repo.id));

      setSelectedRows((prev) => [...prev, ...newSelections]);
    } else {
      const currentPageIds = new Set(repositories?.map((repo) => repo.id) || []);
      setSelectedRows((prev) => prev.filter((row) => !currentPageIds.has(row.id)));
    }
  };

  const startRepoScan = async (repoId: number) => {
    return new Promise((resolve, reject) => {
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/repo/scan`,
          method: 'POST',
          data: {
            repository_id: repoId,
          },
        },
        (response: any) => {
          if (response) {
            resolve(response);
          } else {
            reject(new Error('Failed to start scan'));
          }
        }
      );
    });
  };

  const areAllCurrentPageItemsSelected =
    repositories?.every((repo: { id: number; name: string }) =>
      selectedRows.some((selected) => selected.id === repo.id)
    ) && repositories?.length > 0;

  const handleSelectRow = (checked: boolean, repo: { id: number; name: string }) => {
    if (checked) {
      setSelectedRows((prev) => [
        ...prev,
        {
          id: repo.id,
          name: repo.name,
        },
      ]);
    } else {
      setSelectedRows((prev) => prev.filter((row) => row.id !== repo.id));
    }
  };

  const handleAddToExistingGroup = () => {
    setIsExistingGroupDialogOpen(true);
  };

  const handleCreateNewGroup = () => {
    setSelectedGroupRepos(selectedRows);
    setIsNewGroupDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={4} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
            <div className="flex-1 flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="w-[150px] flex justify-start">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[150px] flex justify-start">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[150px] flex justify-start">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[150px] flex justify-start">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="w-[50px] flex justify-center">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </TableCell>
    </TableRow>
  );

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-96">
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 p-4 rounded-full mb-4">
            <GitFork className="w-12 h-12 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-center">No Repositories Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            There are currently no repositories available. Try adjusting your search or filters, or
            add new repositories to scan.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {selectedRows.length > 0 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Repositories</span>
                  <Badge variant="secondary" className="font-mono">
                    {selectedRows.length}
                  </Badge>
                </div>

                {selectedRows.length > 1 && (
                  <button
                    onClick={() => setSelectedRows([])}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-2 hover:bg-secondary/80">
                      <FolderPlus className="h-4 w-4" />
                      Add to Group
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[240px] p-2" sideOffset={5}>
                    <DropdownMenuItem
                      className="flex items-start gap-2 p-2 cursor-pointer hover:bg-secondary focus:bg-secondary"
                      onClick={() => handleAddToExistingGroup()}
                    >
                      <div className="mt-0.5">
                        <FolderEdit className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">Add to Existing Group</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          Add selected repositories to a previously created group
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-start gap-2 p-2 cursor-pointer hover:bg-secondary focus:bg-secondary"
                      onClick={() => handleCreateNewGroup()}
                    >
                      <div className="mt-0.5">
                        <FolderPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">Create New Group</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          Create a new group with selected repositories
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AddToExistingGroupDialog
                  isOpen={isExistingGroupDialogOpen}
                  onClose={() => setIsExistingGroupDialogOpen(false)}
                  onSuccess={() => {
                    setSelectedRows([]);
                    // Handle other success actions
                  }}
                  selectedRepos={selectedRows}
                  onReposChange={setSelectedRows}
                />

                <AddToNewGroupDialog
                  isOpen={isNewGroupDialogOpen}
                  onClose={() => setIsNewGroupDialogOpen(false)}
                  onSuccess={() => {
                    setSelectedRows([]);
                    // Handle other success actions
                  }}
                  selectedRepos={selectedGroupRepos}
                  onReposChange={setSelectedGroupRepos}
                />
              </div>
            </div>
            <hr className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <div className="flex flex-wrap gap-2">
              {selectedRows.map((repo) => (
                <div
                  key={repo.id}
                  className="group flex items-center gap-1.5 bg-background text-sm px-3 py-1.5 rounded-full border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[200px] truncate">{repo.name}</span>
                  <button
                    onClick={() => handleSelectRow(false, { id: repo.id, name: repo.name })}
                    className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    aria-label={`Remove ${repo.name} from selection`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-card shadow-sm overflow-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950">
              <TableHead className="w-[50px] p-0 ps-2">
                <div className="h-8 flex items-center justify-center">
                  <Checkbox
                    checked={areAllCurrentPageItemsSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all on current page"
                  />
                </div>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleOrderChange()}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <GitBranch className="mr-2 h-4 w-4 text-white-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  Repository
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70 transition-opacity" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  onClick={() => handleSortByChange('author')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <CircleUser className="mr-2 h-4 w-4 text-white-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  Author
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70 transition-opacity" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  onClick={() => handleSortByChange('secrets_count')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <Shield className="mr-2 h-4 w-4 text-white-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  Secrets
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('score_normalized')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <Shield className="mr-2 h-4 w-4 text-white-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('created_at')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <Calendar className="mr-2 h-4 w-4 text-white-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70 transition-opacity" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : repositories.length === 0 ? (
              <EmptyState />
            ) : (
              repositories?.map((repo) => (
                <TableRow key={repo.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="p-0 ps-2">
                    <div className="h-16 flex items-center justify-center">
                      <Checkbox
                        checked={selectedRows.some((row) => row.id === repo.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(checked as boolean, {
                            id: repo.id,
                            name: repo.name,
                          })
                        }
                        aria-label={`Select ${repo.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
                            <GitFork className="h-5 w-5 text-primary-500" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary/90 text-base leading-tight">
                                {repo.name}
                              </span>
                              <a
                                href={
                                  repo.repoUrl.endsWith('.git')
                                    ? repo?.repoUrl.slice(0, -4)
                                    : repo?.repoUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                                title="View Repository"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <span className="text-xs text-muted-foreground/50">•</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                        <CircleUser className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="font-medium">{repo.author}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      onClick={() => {
                        setIsOpen(true);
                        setSelectedRepo({ id: repo.id, name: repo.name });
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary-500 group-hover/btn:scale-110 transition-transform duration-200" />
                        <span className="font-medium">{repo.secrets_count}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary-500 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                    </Button>
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const score = Math.ceil(repo.score_normalized);
                      const { className, label } = getScoreBadgeStyle(score);
                      return (
                        <Badge
                          variant="outline"
                          className={`${className} px-3 py-1 font-medium  items-center gap-2`}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <div className="flex flex-col items-start">
                            <span className="text-sm">{label}</span>
                            {/* <span className="text-xs opacity-90">Score: {100 - score}</span> */}
                          </div>
                        </Badge>
                      );
                    })()}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {new Date(repo.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatAMPM(new Date(repo.created_at))}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-background">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {/*  */}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo({ id: repo.id, name: repo.name });
                            setIsRepoDetailDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <GitFork className="h-4 w-4" />
                          View Repo Details
                        </DropdownMenuItem>
                        {/*  */}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo({ id: repo.id, name: repo.name });
                            setIsPropertiesDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          View Properties
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo({ id: repo.id, name: repo.name });
                            setIsSBOMDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          View SBOM
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigate(`/secret/incidents?repo_id=${repo?.id}`);
                          }}
                          className="flex items-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          View Incidents
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRepo({ id: repo.id, name: repo.name });
                            setIsAllowlistDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Add to Allow List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            // Loading toast
                            const toastId = toast.loading(`Starting scan for ${repo.name}...`);

                            try {
                              await startRepoScan(repo.id);
                              toast.success('Scan started successfully', {
                                id: toastId,
                                description: `Scan initiated for repository ${repo.name}`,
                              });
                            } catch (error) {
                              toast.error('Failed to start scan', {
                                id: toastId,
                                description: 'There was an error starting the repository scan',
                              });
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <GitBranch className="h-4 w-4" />
                          Run Scan
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Export Report
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRepo && (
        <RepoPropertiesDialog
          isOpen={isPropertiesDialogOpen}
          onClose={() => {
            setIsPropertiesDialogOpen(false);
            setSelectedRepo(null);
          }}
          repoName={selectedRepo.name}
          repoId={selectedRepo.id}
        />
      )}

      {isOpen && (
        <ViewSecretsForRepoDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          repoName={selectedRepo?.name}
          repoId={selectedRepo?.id}
        />
      )}

      {selectedRepo && (
        <RepositoryDetailDialog
          open={isRepoDetailDialogOpen}
          onOpenChange={(open) => {
            setIsRepoDetailDialogOpen(open);
            if (!open) setSelectedRepo(null);
          }}
          repoId={selectedRepo.id}
          commonAPIRequest={commonAPIRequest}
        />
      )}

      {selectedRepo && (
        <AddAllowlistFromRepoDialog
          open={isAllowlistDialogOpen}
          onOpenChange={(open) => {
            setIsAllowlistDialogOpen(open);
            if (!open) setSelectedRepo(null);
          }}
          repository={{ id: selectedRepo.id, name: selectedRepo.name }}
          onSuccess={() => {
            toast.success('Allow list created successfully');
            setIsAllowlistDialogOpen(false);
            setSelectedRepo(null);
          }}
          type={'SECRET'}
        />
      )}

      {selectedRepo && (
        <ViewRepoSBOMDialog
          open={isSBOMDialogOpen}
          onOpenChange={(open) => {
            setIsSBOMDialogOpen(open);
            if (!open) setSelectedRepo(null);
          }}
          repoId={selectedRepo.id}
          commonAPIRequest={commonAPIRequest}
        />
      )}
    </>
  );
};

// Utility functions
const getScoreBadgeStyle = (score: number) => {
  if (score >= 81) {
    return {
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400  items-center',
      label: 'Critical',
    };
  }
  if (score >= 61) {
    return {
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400  items-center',
      label: 'Poor',
    };
  }
  if (score >= 41) {
    return {
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400  items-center',
      label: 'Fair',
    };
  }
  if (score >= 21) {
    return {
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400  items-center',
      label: 'Good',
    };
  }
  return {
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400  items-center',
    label: 'Excellent',
  };
};

export default RepoTable;
