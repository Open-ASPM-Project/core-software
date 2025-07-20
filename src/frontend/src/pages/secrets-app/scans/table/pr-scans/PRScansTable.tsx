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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Github,
  GitBranch,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  FolderGit2,
  Loader2,
  ArrowUpDown,
  Shield,
  Calendar,
  GitMerge,
  AlertCircle,
  Server,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { formatAMPM } from '@/utils/commonFunctions';
import ViewSecretsForPRScansDialog from '../../dialogs/pr-scans/ViewSecretsForPRScansDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

// Types
interface PR {
  pr_id: number;
  pr_name: string;
  repo_id: number;
  pr_link: string;
  vctype: string;
  vc_id: number;
  webhook_id: number;
  last_scan: string | null;
  secret_count: number | null;
  vulnerability_count: number | null;
  id: number;
  created_at: string;
}

interface PRScan {
  pr_id: number;
  vc_id: number;
  webhook_id: number;
  repo_id: number;
  vc_type: string;
  status: string;
  block_status: boolean;
  scan_type: string;
  id: number;
  created_at: string;
  pr: PR;
  vc_name: string;
  repo_name: string;
  secret_count: number;
  vulnerability_count: number;
}

const SecretsBadge = ({
  count,
  onView,
}: {
  count: number;
  onView: (e: React.MouseEvent) => void;
}) => {
  let colorClasses = {
    icon: 'text-green-500',
    bg: 'bg-green-500/10 group-hover/btn:bg-green-500/20',
  };

  if (count > 10) {
    colorClasses = {
      icon: 'text-red-500',
      bg: 'bg-red-500/10 group-hover/btn:bg-red-500/20',
    };
  } else if (count > 5) {
    colorClasses = {
      icon: 'text-amber-500',
      bg: 'bg-amber-500/10 group-hover/btn:bg-amber-500/20',
    };
  }

  return (
    <Button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onView(e);
      }}
      variant="ghost"
      size="sm"
      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn"
    >
      <div className="flex items-center gap-2">
        <div className={`rounded-md p-1.5 transition-colors ${colorClasses.bg}`}>
          <Shield className={`h-4 w-4 ${colorClasses.icon}`} />
        </div>
        <span className="font-medium min-w-[20px]">{count} Secrets</span>
      </div>
      <ChevronRight className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
    </Button>
  );
};

// Components
const VCIcon = ({ type }: { type: string }) => {
  switch (type.toLowerCase()) {
    case 'github':
      return <Github className="w-4 h-4" />;
    case 'gitlab':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
        </svg>
      );
    case 'bitbucket':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891L.778 1.213zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z" />
        </svg>
      );
    default:
      return <GitBranch className="w-4 h-4" />;
  }
};

const StatusBadge = ({ status, processing }: { status: boolean; processing: boolean }) => {
  const getStatusStyle = () => {
    if (processing) {
      return {
        containerClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        Icon: Loader2,
        spinning: true,
      };
    }
    if (status) {
      return {
        containerClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        Icon: XCircle,
        spinning: false,
      };
    }
    return {
      containerClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Icon: CheckCircle2,
      spinning: false,
    };
  };

  const { containerClass, Icon, spinning } = getStatusStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${containerClass}`}
    >
      <Icon className={`w-3 h-3 ${spinning ? 'animate-spin' : ''}`} />
      {processing ? 'processing' : status ? 'failed' : 'passed'}
    </span>
  );
};

const PRScansTable = ({
  isLoading,
  prScans,
  limit,
  handleSortByChange,
}: {
  isLoading: boolean;
  prScans: PRScan[] | [];
  limit: number;
  handleSortByChange: (
    field:
      | 'vc_name'
      | 'repo_name'
      | 'secret_count'
      | 'vulnerability_count'
      | 'created_at'
      | 'pr_id'
      | 'status'
  ) => void;
}) => {
  const navigate = useNavigate();
  const [selectedPR, setSelectedPR] = React.useState<PR | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleViewSecrets = (pr: PR) => {
    setSelectedPR(pr);
    setIsDialogOpen(true);
  };

  const handlePRClick = (pr_link: string) => {
    window.open(pr_link, '_blank');
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
            <div className="w-[150px]">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="w-[150px]">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="w-[150px]">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[150px]">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="w-[50px]">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </TableCell>
    </TableRow>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 p-4 rounded-full mb-4">
        <GitPullRequest className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">No PR Scans Found</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        There are currently no PR scans available. Try adjusting your filters or creating new pull
        requests to scan.
      </p>
    </div>
  );

  return (
    <div className="space-y-4 rounded-md dark:border-gray-700">
      <div className="rounded-md border dark:border-gray-700 custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('vc_name')}
                >
                  <Server className="w-4 h-4 mr-2" />
                  VC Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('status')}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('repo_name')}
                >
                  <FolderGit2 className="w-4 h-4 mr-2" />
                  Repository
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('pr_id')}
                >
                  <GitMerge className="w-4 h-4 mr-2" />
                  Pull Request
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('secret_count')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Secrets
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('created_at')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Created At
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : prScans?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              prScans?.map((scan) => (
                <TableRow
                  key={scan.id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                        <VCIcon type={scan.vc_type} />
                      </div>
                      <span className="font-medium">{scan.vc_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={scan.block_status}
                      processing={scan?.status === 'processing'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-md">
                        <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium">{scan.repo_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-md cursor-pointer transition-colors group"
                      onClick={() => handlePRClick(scan.pr.pr_link)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handlePRClick(scan.pr.pr_link);
                        }
                      }}
                    >
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-md">
                        <GitPullRequest className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        PR-{scan.pr.pr_id}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <SecretsBadge
                      onView={() =>
                        handleViewSecrets({
                          id: scan.pr_id,
                          repoId: scan?.repo_id,
                          title: scan?.pr.pr_name,
                        })
                      }
                      count={scan.secret_count}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                        <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(scan.created_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAMPM(new Date(scan.created_at))}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-100 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                          onClick={() => {
                            navigate(
                              `/secret/incidents?repo_ids=${scan?.repo_id}&pr_ids=${scan?.pr?.id}`
                            );
                          }}
                          className="text-blue-600 dark:text-blue-400"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          View Incident
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem>
                          <a
                            href={scan.pr.pr_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 dark:text-blue-400"
                          >
                            <GitPullRequest className="w-4 h-4 mr-2" />
                            View PR
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
      {selectedPR && (
        <ViewSecretsForPRScansDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedPR(null);
          }}
          prTitle={selectedPR.title}
          prId={selectedPR.id}
          repoId={selectedPR.repoId}
        />
      )}
    </div>
  );
};

export default PRScansTable;
