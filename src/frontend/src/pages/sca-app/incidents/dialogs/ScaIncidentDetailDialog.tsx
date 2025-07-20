import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import {
  BugOff,
  AlertCircle,
  Clock,
  Shield,
  CalendarClock,
  Loader2,
  Tag,
  Type,
  LayoutDashboard,
  UserCheck,
  MessageSquare,
  Activity,
  RefreshCcw,
  CheckCircle,
  GitBranch,
  FolderGit2,
  Github,
  Gitlab,
  Package,
  Bug,
  AlertTriangle,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import CommentsSection from '@/pages/secrets-app/incidents/dialogs/CommentsSection';
import ActivitySection from '@/pages/secrets-app/incidents/dialogs/ActivitySection';

interface ScaIncidentDetail {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  closed_by: string | null;
  vulnerability_id: number;
  secret_id: null;
  secret: null;
  vulnerability: {
    id: number;
    cve_id: string;
    description: string;
    artifact_type: string;
    cvss_base_score: number;
    cvss_impact_score: number;
    cvss_exploitability_score: number;
    vulnerability_data_source: string;
    package: string;
    package_version: string;
    severity: string;
    vulnerability_type: string;
    fix_available: boolean;
    author: string;
    all_details: {
      vulnerability: {
        description: string;
        urls: string[];
      };
    };
  };
}

interface Repository {
  id: number;
  name: string;
  repoUrl: string;
  author: string;
  vctype: string;
  score_normalized: number;
  lastScanDate: string;
  created_at: string;
  updated_at: string;
  other_repo_details: {
    description: string;
    language: string | null;
    visibility: string;
    default_branch: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    license: {
      name: string;
    } | null;
    created_at: string;
    updated_at: string;
    size: number;
  };
}

interface ScaIncidentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: number;
  repository: Repository;
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

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-sm text-muted-foreground">Loading vulnerability details...</p>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <Alert variant="destructive" className="m-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

const getStatusColor = (status: string) => {
  const colors = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return colors[status] || colors.open;
};

const getSeverityColor = (severity: string) => {
  const colors = {
    critical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[severity.toLowerCase()] || colors.unknown;
};

const ScaIncidentDetailDialog: React.FC<ScaIncidentDetailDialogProps> = ({
  open,
  onOpenChange,
  incidentId,
  repository,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [incidentDetail, setIncidentDetail] = React.useState<ScaIncidentDetail | null>(null);
  const [activePath, setActivePath] = React.useState<'details' | 'comments' | 'activity'>(
    'details'
  );

  const statusOptions = ['open', 'in-progress', 'closed'];
  const severityOptions = ['critical', 'high', 'medium', 'low'];

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    const endpoint = API_ENDPOINTS.incidents.updateIncidentStatus;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: api + incidentId + '/status?status=' + newStatus,
        method: endpoint.method,
        data: { status: newStatus },
      },
      (response) => {
        setIsUpdating(false);
        if (response) {
          setIncidentDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
          toast.success(`Status updated to ${newStatus}`);
        } else {
          toast.error('Failed to update status');
        }
      }
    );
  };

  const handleSeverityUpdate = async (newSeverity: string) => {
    setIsUpdating(true);
    const endpoint = API_ENDPOINTS.incidents.updateIncidentSeverity;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: api + incidentId + '/severity?severity=' + newSeverity,
        method: endpoint.method,
        data: { severity: newSeverity },
      },
      (response) => {
        setIsUpdating(false);
        if (response) {
          setIncidentDetail((prev) =>
            prev
              ? { ...prev, vulnerability: { ...prev.vulnerability, severity: newSeverity } }
              : null
          );
          toast.success(`Severity updated to ${newSeverity}`);
        } else {
          toast.error('Failed to update severity');
        }
      }
    );
  };

  const fetchIncidentDetails = React.useCallback(() => {
    if (!incidentId) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.incidents.getIncidentDetails;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest<ScaIncidentDetail>(
      {
        api: api + incidentId,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setIncidentDetail(response);
        } else {
          setError('Failed to fetch vulnerability details');
        }
      }
    );
  }, [incidentId, commonAPIRequest]);

  React.useEffect(() => {
    if (open) {
      fetchIncidentDetails();
    } else {
      setIncidentDetail(null);
      setError(null);
    }
  }, [open, fetchIncidentDetails]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 h-[70vh]">
        <DialogHeader className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-600/20 dark:to-orange-600/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <BugOff className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Incident Details</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{incidentDetail?.type}</span>
                </div>
              </div>
            </div>
            {incidentDetail && (
              <div className="flex items-center gap-4">
                <Select
                  defaultValue={incidentDetail.status}
                  onValueChange={(e) => handleStatusUpdate(e)}
                  disabled={isUpdating}
                >
                  <SelectTrigger
                    className={`w-[150px] transition-all duration-200 border-2 
                    ${getStatusColor(incidentDetail.status)} hover:shadow-md
                    bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800`}
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className={`transition-all duration-200 hover:bg-gradient-to-r 
                        ${status === 'open' && 'hover:from-blue-50 hover:to-blue-100/50 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30'}
                        ${status === 'in-progress' && 'hover:from-yellow-50 hover:to-yellow-100/50 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30'}
                        ${status === 'closed' && 'hover:from-green-50 hover:to-green-100/50 dark:hover:from-green-900/30 dark:hover:to-green-800/30'}`}
                      >
                        <div className="flex items-center gap-2">
                          {status === 'open' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                          {status === 'in-progress' && (
                            <RefreshCcw className="w-4 h-4 text-yellow-500" />
                          )}
                          {status === 'closed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          <span className="capitalize">{status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  defaultValue={incidentDetail.vulnerability.severity}
                  onValueChange={(e) => handleSeverityUpdate(e)}
                  disabled={isUpdating}
                >
                  <SelectTrigger
                    className={`w-[150px] transition-all duration-200 border-2
              ${getSeverityColor(incidentDetail.vulnerability.severity)} hover:shadow-md
              bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800`}
                  >
                    <div className="flex items-center gap-2">
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2">
                    {severityOptions.map((severity) => (
                      <SelectItem
                        key={severity}
                        value={severity}
                        className={`transition-all duration-200 hover:bg-gradient-to-r 
                  ${severity === 'critical' && 'hover:from-purple-50 hover:to-purple-100/50 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30'}
                  ${severity === 'high' && 'hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/30 dark:hover:to-red-800/30'}
                  ${severity === 'medium' && 'hover:from-yellow-50 hover:to-yellow-100/50 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30'}
                  ${severity === 'low' && 'hover:from-green-50 hover:to-green-100/50 dark:hover:from-green-900/30 dark:hover:to-green-800/30'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield
                            className={`w-4 h-4 
                    ${severity === 'critical' && 'text-purple-500'}
                    ${severity === 'high' && 'text-red-500'}
                    ${severity === 'medium' && 'text-yellow-500'}
                    ${severity === 'low' && 'text-green-500'}`}
                          />
                          <span className="capitalize">{severity}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="border-b">
          <div className="flex items-center p-2">
            <Button
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activePath === 'details' ? 'active' : 'inactive'}
              onClick={() => setActivePath('details')}
            >
              <Bug className="w-4 h-4" />
              Details
            </Button>
            <Button
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activePath === 'comments' ? 'active' : 'inactive'}
              onClick={() => setActivePath('comments')}
            >
              <MessageSquare className="w-4 h-4" />
              Comments
            </Button>
            <Button
              variant="ghost"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activePath === 'activity' ? 'active' : 'inactive'}
              onClick={() => setActivePath('activity')}
            >
              <Activity className="w-4 h-4" />
              Activity
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[80vh]">
          {activePath === 'details' &&
            (isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : incidentDetail ? (
              <div className="p-6 space-y-6">
                {/* Vulnerability Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-red-500" />
                    Vulnerability Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-red-500" />
                        <span className="font-medium">CVE ID</span>
                      </div>
                      <p className="text-sm font-mono">{incidentDetail.vulnerability.cve_id}</p>
                    </div>
                    {incidentDetail.closed_by && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Closed By</span>
                        </div>
                        <p className="text-sm">{incidentDetail.closed_by}</p>
                      </div>
                    )}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Package Details</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-mono">
                          {incidentDetail.vulnerability.package}@
                          {incidentDetail.vulnerability.package_version}
                        </p>
                        <Badge
                          variant="secondary"
                          className={
                            incidentDetail.vulnerability.fix_available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {incidentDetail.vulnerability.fix_available
                            ? 'Fix Available'
                            : 'No Fix Available'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vulnerability Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Vulnerability Description
                  </h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{incidentDetail.vulnerability.description}</p>
                  </div>
                </div>

                <Separator />

                {/* CVSS Scores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    CVSS Scores
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">Base Score</span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {incidentDetail.vulnerability.cvss_base_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertOctagon className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Impact Score</span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {incidentDetail.vulnerability.cvss_impact_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Exploitability</span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {incidentDetail.vulnerability.cvss_exploitability_score.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Repository Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-red-500" />
                    Repository Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderGit2 className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Repository</span>
                      </div>
                      <p className="text-sm">{repository.name}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {repository.vctype === 'github' ? (
                          <Github className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Gitlab className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="font-medium">Repository URL</span>
                      </div>
                      <a
                        href={
                          repository.repoUrl.endsWith('.git')
                            ? repository?.repoUrl.slice(0, -4)
                            : repository?.repoUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline truncate max-w-[48ch] block"
                      >
                        {repository.repoUrl}
                      </a>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timestamps & Attribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-red-500" />
                    Timeline & Attribution
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Created At</span>
                        </div>
                        <p className="text-sm">
                          {format(new Date(incidentDetail.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Updated At</span>
                        </div>
                        <p className="text-sm">
                          {format(new Date(incidentDetail.updated_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null)}
          {activePath === 'comments' && <CommentsSection incidentId={incidentId} />}
          {activePath === 'activity' && <ActivitySection incidentId={incidentId} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(ScaIncidentDetailDialog);
