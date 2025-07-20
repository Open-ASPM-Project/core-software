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
  Shield,
  Activity,
  GitFork,
  Scan,
  Calendar,
  FolderGit2,
  Loader2,
  ArrowUpDown,
  Server,
  GitCommit,
  KeyRound,
  ChevronRight,
  GitPullRequest,
  MessageSquare,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { formatAMPM } from '@/utils/commonFunctions';
import ViewSecretsForCommitScansDialog from '../../dialogs/commit-scans/ViewSecretsForCommitScansDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

// Types
interface CommitScan {
  id: number;
  vc_id: number;
  repo_id: number;
  vc_name: string;
  repo_name: string;
  commit_id: string;
  commit_url: string;
  author_name: string;
  commit_msg: string;
  status: string;
  scan_type: string;
  secret_count: number;
  vulnerability_count: number;
  created_at: string;
  vc_type?: string;
}

// Components
const VCIcon = ({ type }: { type: string }) => {
  switch (type?.toLowerCase()) {
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

const StatusBadge = ({ status }: { status: string }) => {
  const statusLower = status.toLowerCase();

  const getStatusStyle = () => {
    switch (statusLower) {
      case 'completed':
        return {
          containerClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          Icon: CheckCircle2,
          spinning: false,
        };
      case 'processing':
        return {
          containerClass:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          Icon: Loader2,
          spinning: true,
        };
      default: // failed or any other status
        return {
          containerClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          Icon: XCircle,
          spinning: false,
        };
    }
  };

  const { containerClass, Icon, spinning } = getStatusStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${containerClass}`}
    >
      <Icon className={`w-3 h-3 ${spinning ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
};

// Add this badge component for secrets count
const SecretsBadge = ({ count }: { count: number }) => {
  let color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (count > 10) {
    color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  } else if (count > 5) {
    color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      <Shield className="w-3.5 h-3.5" />
      {count} Secrets
    </div>
  );
};

// Add this component for scan type badge
const ScanTypeBadge = ({ type }: { type: string }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      <GitCommit className="w-3.5 h-3.5" />
      {type}
    </div>
  );
};

const CommitScansTable = ({
  isLoading,
  commitScans,
  limit,
  handleSortByChange,
}: {
  isLoading: boolean;
  commitScans: CommitScan[];
  limit: number;
  handleSortByChange: (
    field: 'vc_name' | 'repo_name' | 'secret_count' | 'vulnerability_count' | 'created_at'
  ) => void;
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedScan, setSelectedScan] = React.useState<{
    commitId: string;
    commitScanId: number;
  } | null>(null);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
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
            <div className="w-[100px]">
              <Skeleton className="h-4 w-16" />
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
    <TableRow>
      <TableCell colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16">
          {/* Icon Container with Gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/5 dark:to-blue-500/5 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 p-6 rounded-full mb-4">
              <GitPullRequest className="w-12 h-12 text-emerald-600/90 dark:text-emerald-400/90" />
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
            No Commit Scans Found
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            No Commit scans are currently available. This could be because no pull requests have
            been scanned yet or your current filter settings don't match any results.
          </p>
        </div>
      </TableCell>
    </TableRow>
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
                >
                  <GitCommit className="w-4 h-4 mr-2" />
                  Commit
                </Button>
              </TableHead>
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
              {/* <TableHead>
                <Button variant="ghost" className="h-8 w-full justify-start font-bold text-primary">
                  <Activity className="w-4 h-4 mr-2" />
                  Status
                </Button>
              </TableHead> */}
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                  onClick={() => handleSortByChange('repo_name')}
                >
                  <GitFork className="w-4 h-4 mr-2" />
                  Repository
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400  text-primary"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan Type
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
            ) : commitScans.length === 0 ? (
              <EmptyState />
            ) : (
              commitScans?.map((scan) => (
                <TableRow
                  key={scan.id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={scan.commit_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                        >
                          <GitCommit className="w-4 h-4" />
                          {scan.commit_id.substring(0, 7)}
                        </a>
                        <div className="group relative">
                          <MessageSquare className="w-4 h-4 text-muted-foreground cursor-help" />
                          <span className="absolute left-0 top-6 scale-0 transition-all rounded bg-background border border-border p-2 text-xs text-foreground group-hover:scale-100 w-48 break-words z-50 shadow-lg">
                            {scan.commit_msg}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs ms-6 text-muted-foreground">
                        by {scan.author_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 p-1">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                        <VCIcon type={scan.vc_type || ''} />
                      </div>
                      <span className="font-medium">{scan.vc_name || `VC-${scan.vc_id}`}</span>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <StatusBadge status={scan.status} />
                  </TableCell> */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-md">
                        <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium">
                        {scan.repo_name || `Repository ${scan.repo_id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ScanTypeBadge type={scan.scan_type} />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setIsOpen(true);
                        setSelectedScan({
                          commitId: scan.commit_id,
                          commitScanId: scan.id,
                          repoId: scan?.repo_id,
                        });
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary-500 group-hover/btn:scale-110 transition-transform duration-200" />
                        <span className="font-medium">{scan.secret_count} Secrets</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary-500 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(scan.created_at).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs">{formatAMPM(new Date(scan.created_at))}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-100 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            navigate(
                              `/secret/incidents?commits=${scan?.commit_id}&repo_ids=${scan?.repo_id}`
                            );
                          }}
                          className="text-blue-600 dark:text-blue-400"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          View Incidents
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem className="text-red-600 dark:text-red-400">
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

      {isOpen && selectedScan && (
        <ViewSecretsForCommitScansDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          commitId={selectedScan.commitId}
          commitScanId={selectedScan.commitScanId}
          repoId={selectedScan.repoId}
        />
      )}
    </div>
  );
};

export default CommitScansTable;
