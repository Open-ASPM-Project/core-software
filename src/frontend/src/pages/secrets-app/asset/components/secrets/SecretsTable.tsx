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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  MoreVertical,
  SearchX,
  Code,
  Shield,
  Check,
  Copy,
  Calendar,
  GitFork,
  FileCode2,
  AlertOctagon,
  Eye,
  ChevronRightIcon,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SecretDetailDialog from '../../dialogs/secrets/SecretDetailDialog';
import ViewRepositoriesForSecretDialog from '../../dialogs/secrets/ViewRepositoriesForSecretDialog';
import { useNavigate } from 'react-router-dom';
import AddAllowlistFromSecret from '../../dialogs/secrets/AddAllowlistFromSecret';

// Types
interface Repository {
  repo_id: number;
  repo_name: string;
  repo_count: number;
}

interface Secret {
  created_at: string | number | Date;
  secret_id: number;
  id: number;
  secret: string;
  rule: string;
  repositories: Repository[];
  repo_count: number;
  avg_score_normalized: number;
  score_normalized_on: string;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'score' | 'repo_count' | 'created_at' | 'rule';
}

const SecretTable = ({
  secrets,
  isLoading,
  limit,
  handleOrderChange,
  handleSortByChange,
}: {
  isLoading: boolean;
  secrets: Secret[];
  limit: number;
  handleOrderChange: () => void;
  handleSortByChange: (field: QueryParams['sort_by']) => void;
}) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = React.useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedSecret, setSelectedSecret] = React.useState<Secret | null>(null);

  const [repoDialogOpen, setRepoDialogOpen] = React.useState(false);
  const [selectedSecretForRepos, setSelectedSecretForRepos] = React.useState<string>('');
  const [isAllowlistDialogOpen, setIsAllowlistDialogOpen] = React.useState(false);
  const [selectedSecretForAllowlist, setSelectedSecretForAllowlist] = React.useState<string>('');

  const handleViewRepositories = (e: React.MouseEvent, secret: Secret) => {
    e.stopPropagation();
    setSelectedSecretForRepos(secret.secret);
    setRepoDialogOpen(true);
  };

  const handleViewDetails = (secret: Secret) => {
    setSelectedSecret(secret);
    setDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
            <div className="flex-1 flex items-center gap-2">
              <Skeleton className="h-4 w-[200px]" />
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
            <KeyRound className="w-12 h-12 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-center">No Secrets Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            There are currently no secrets detected. Try adjusting your search filters or run a new
            scan to detect secrets.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  const copyToClipboard = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-md border custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950">
            <TableHead>
              <Button
                onClick={() => handleOrderChange()}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <FileCode2 className="h-4 w-4 mr-2" />
                Secret
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('rule')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Shield className="h-4 w-4 mr-2" />
                Rule
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('repo_count')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <GitFork className="h-4 w-4 mr-2" />
                Repositories
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('score')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Shield className="h-4 w-4 mr-2" />
                Risk Score
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('created_at')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Calendar className="h-4 w-4 mr-2" />
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
          ) : secrets.length === 0 ? (
            <EmptyState />
          ) : (
            secrets?.map((secret) => (
              <TableRow
                key={secret?.secret_id}
                className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-2 max-w-md">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                      <FileCode2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium text-primary/90 max-w-[32ch] truncate">
                            {secret.secret}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs break-all">{secret.secret}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <button
                      onClick={() => copyToClipboard(secret?.secret_id, secret.secret)}
                      className="ml-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex-shrink-0 transition-colors"
                    >
                      {copiedId === secret?.secret_id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded-md">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium">{secret.rule}</span>
                  </div>
                </TableCell>
                {/* <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-md">
                      <GitFork className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium">{secret.repo_count} Repos</span>
                  </div>
                </TableCell> */}

                <TableCell>
                  <Button
                    onClick={(e) => handleViewRepositories(e, secret)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-500/10 p-1.5 group-hover/btn:bg-blue-500/20 transition-colors">
                        <GitFork className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium min-w-[20px]">{secret.repo_count} Repos</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                  </Button>
                </TableCell>

                {/*  */}

                <TableCell>
                  {(() => {
                    const score = Math.ceil(secret.avg_score_normalized);
                    const { className, label } = getScoreBadgeStyle(score);
                    return (
                      <Badge
                        variant="outline"
                        className={`${className} px-3 py-1 font-medium items-center gap-2`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{label}</span>
                        </div>
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(secret.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(secret.created_at).toLocaleString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-100 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onSelect={() => handleViewDetails(secret)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem> */}
                      <DropdownMenuItem
                        onClick={() => {
                          navigate(`/secret/incidents?secrets=${secret?.secret}`);
                        }}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        View Incidents
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSecretForAllowlist(secret.secret);
                          setIsAllowlistDialogOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2 text-green-500" /> Add To Allowlist
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem>
                        <AlertOctagon className="h-4 w-4 mr-2 text-orange-500" /> Mark as False
                        Positive
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedSecret && (
        <SecretDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          secretId={selectedSecret?.secret_id}
        />
      )}

      <AddAllowlistFromSecret
        open={isAllowlistDialogOpen}
        onOpenChange={setIsAllowlistDialogOpen}
        secretName={selectedSecretForAllowlist}
        onSuccess={() => {
          // Handle any refresh or update needed after successful creation
        }}
      />

      <ViewRepositoriesForSecretDialog
        open={repoDialogOpen}
        onOpenChange={setRepoDialogOpen}
        secretName={selectedSecretForRepos}
      />
    </div>
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

export default SecretTable;
