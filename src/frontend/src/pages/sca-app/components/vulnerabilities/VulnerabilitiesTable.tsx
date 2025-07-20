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
  Package,
  Shield,
  ExternalLink,
  Copy,
  Calendar,
  AlertTriangle,
  Bug,
  Eye,
  ChevronRightIcon,
  PackageCheck,
  BookOpen,
  GitFork,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import VulnerabilityDetailDialog from '../../asset/dialogs/vulnerabilities/VulnerabilityDetailDialog';
import AddAllowlistFromVulnerability from '../../asset/dialogs/vulnerabilities/AddAllowlistFromVulnerability';
import ViewRepositoriesForVulnerabilityDialog from '../../asset/dialogs/vulnerabilities/ViewRepositoriesForVulnerabilityDialog';

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

interface Vulnerability {
  id: number;
  vulnerability_id: string;
  cve_id: string;
  package: string;
  package_version: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  artifact_type: string;
  cvss_base_score: number;
  fix_available: boolean;
  created_at: string;
  repo_count: number;
  whitelisted: boolean;
  cve_data_source: string;
  all_details: {
    vulnerability: {
      fix: {
        versions: string[];
        state: string;
      };
    };
  };
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'severity' | 'cvss_base_score' | 'created_at' | 'package' | 'repo_count' | 'status';
}

interface VulnerabilitiesTableProps {
  vulnerabilities: Vulnerability[];
  isLoading: boolean;
  handleOrderChange: () => void;
  handleSortByChange: (field: QueryParams['sort_by']) => void;
  currentSortBy?: string;
  currentOrderBy?: 'asc' | 'desc';
}

const VulnerabilitiesTable: React.FC<VulnerabilitiesTableProps> = ({
  vulnerabilities,
  isLoading,
  handleOrderChange,
  handleSortByChange,
  currentSortBy,
  currentOrderBy,
}) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = React.useState<number | null>(null);
  const [selectedVulnId, setSelectedVulnId] = React.useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [isAllowlistDialogOpen, setIsAllowlistDialogOpen] = React.useState(false);
  const [selectedAllowlistVuln, setSelectedAllowlistVuln] = React.useState<Vulnerability | null>(
    null
  );

  const [selectedVulnForRepos, setSelectedVulnForRepos] = React.useState<string>('');
  const [repoDialogOpen, setRepoDialogOpen] = React.useState(false);

  const handleViewRepositories = (e: React.MouseEvent, vuln: Vulnerability) => {
    e.stopPropagation();
    setSelectedVulnForRepos(vuln.vulnerability_id);
    setRepoDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        {Array.from({ length: 5 }).map((_, i) => (
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
      <TableCell colSpan={7} className="h-96">
        <div className="flex flex-col items-center justify-center h-full">
          <SearchX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No vulnerabilities found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search or filters
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

  const getSeverityBadgeStyle = (severity: string) => {
    const styles = {
      Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return styles[severity as keyof typeof styles] || styles.Low;
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
                <Bug className="h-4 w-4 mr-2" />
                CVE ID
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('package')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Package className="h-4 w-4 mr-2" />
                Package
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('severity')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Severity
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
                onClick={() => handleSortByChange('cvss_base_score')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Shield className="h-4 w-4 mr-2" />
                CVSS Score
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
                Detected At
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : vulnerabilities.length === 0 ? (
            <EmptyState />
          ) : (
            vulnerabilities.map((vuln) => (
              <TableRow
                key={vuln.id}
                className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-1.5 rounded-md">
                      <Bug className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-2">
                            <span className="font-medium">{vuln.cve_id}</span>
                            <a href={vuln?.cve_data_source} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to view CVE details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-muted-foreground">{vuln.vulnerability_id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 max-w-md">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-md">
                      <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary/90">{vuln.package}</span>
                        <Badge variant="secondary" className="text-xs">
                          {vuln.artifact_type}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{vuln.package_version}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getSeverityBadgeStyle(capitalize(vuln.severity))} px-3 py-1 font-medium`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    {capitalize(vuln.severity)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Button
                    onClick={(e) => handleViewRepositories(e, vuln)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-500/10 p-1.5 group-hover/btn:bg-blue-500/20 transition-colors">
                        <GitFork className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium min-w-[20px]">{vuln.repo_count} Repos</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                      <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium">{vuln.cvss_base_score.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(vuln.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(vuln.created_at)
                          .toLocaleString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {vuln.fix_available ? (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      <PackageCheck className="h-3.5 w-3.5 mr-1" />
                      Fix Available
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      No Fix
                    </Badge>
                  )}
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
                      <DropdownMenuItem
                        onClick={() => window.open(vuln.vulnerability_data_source, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        View Advisory
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          navigate(`/sca/incidents?vulnerability_id=${vuln?.vulnerability_id}`);
                        }}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        View Incidents
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => {
                          setSelectedAllowlistVuln(vuln);
                          setIsAllowlistDialogOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4" />
                        Add To Allowlist
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedVulnId(vuln.id);
                          setIsDetailDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <VulnerabilityDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        vulnerabilityId={selectedVulnId || 0}
      />
      {selectedAllowlistVuln && (
        <AddAllowlistFromVulnerability
          open={isAllowlistDialogOpen}
          onOpenChange={setIsAllowlistDialogOpen}
          vulnerabilityName={selectedAllowlistVuln.cve_id}
          onSuccess={() => {
            setIsAllowlistDialogOpen(false);
            setSelectedAllowlistVuln(null);
          }}
        />
      )}

      <ViewRepositoriesForVulnerabilityDialog
        open={repoDialogOpen}
        onOpenChange={setRepoDialogOpen}
        vulnerabilityName={selectedVulnForRepos}
      />
    </div>
  );
};

export default VulnerabilitiesTable;
