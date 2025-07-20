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
  ShieldAlert,
  AlertCircle,
  Clock,
  GitCommit,
  User,
  Mail,
  FileCode,
  Eye,
  ArrowRight,
  Hash,
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
  Check,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import ActivitySection from './ActivitySection';
import CommentsSection from './CommentsSection';

interface IncidentDetail {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  closed_by: string | null;
  secret: {
    id: number;
    rule: string;
    severity: string;
    description: string;
    file: string;
    line: string;
    commit: string;
    author: string;
    email: string;
    date: string;
    score_normalized: number;
    message: string;
    match: string;
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

interface IncidentDetailDialogProps {
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
    <p className="text-sm text-muted-foreground">Loading incident details...</p>
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

const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  open,
  onOpenChange,
  incidentId,
  repository,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [incidentDetail, setIncidentDetail] = React.useState<IncidentDetail | null>(null);
  const [activePath, setActivePath] = React.useState<'details' | 'comments' | 'activity'>(
    'details'
  );

  const statusOptions = ['open', 'in-progress', 'closed'];
  const severityOptions = ['critical', 'high', 'medium', 'low'];

  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(incidentDetail.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

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
            prev ? { ...prev, secret: { ...prev.secret, severity: newSeverity } } : null
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

    commonAPIRequest<IncidentDetail>(
      {
        api: api + incidentId,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setIncidentDetail(response);
        } else {
          setError('Failed to fetch incident details');
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
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:to-purple-600/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Incident Details</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{incidentDetail?.id}</span>
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
                  defaultValue={incidentDetail.secret.severity}
                  onValueChange={(e) => handleSeverityUpdate(e)}
                  disabled={isUpdating}
                >
                  <SelectTrigger
                    className={`w-[150px] transition-all duration-200 border-2
              ${getSeverityColor(incidentDetail.secret.severity)} hover:shadow-md
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
              <Shield className="w-4 h-4" />
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
                {/* Incident Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-500" />
                    Incident Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Hash className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Incident</span>
                        </div>
                        <button
                          onClick={handleCopy}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                          aria-label="Copy incident text"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-mono truncate max-w-[48ch]">
                        {incidentDetail.name}
                      </p>
                    </div>
                    {incidentDetail.closed_by && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Rule</span>
                        </div>
                        <p className="text-sm">
                          {' '}
                          {incidentDetail.secret.rule
                            ? incidentDetail.secret.rule
                            : incidentDetail.secret.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/*  */}

                <div className="space-y-4">
                  {/* Repository Details Section */}
                  {/* <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-blue-500" />
                      Repository Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderGit2 className="w-4 h-4 text-blue-500" />
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
                          href={repository.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {repository.repoUrl}
                        </a>
                      </div>
                    </div>
                  </div> */}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-blue-500" />
                    Repository Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderGit2 className="w-4 h-4 text-blue-500" />
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

                {/* Secret Details */}
                {/* <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Secret Details
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-violet-500" />
                        <span className="font-medium">
                          {incidentDetail.secret.rule
                            ? incidentDetail.secret.rule
                            : incidentDetail.secret.description}
                        </span>
                      </div>
                      <Badge className={getSeverityColor(incidentDetail.secret.severity)}>
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {incidentDetail.secret.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">{incidentDetail.secret.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <FileCode className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[32ch]">
                            {incidentDetail.secret.file}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Line: {incidentDetail.secret.line}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <GitCommit className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-mono">
                            {incidentDetail?.secret?.commit?.slice(0, 7)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {incidentDetail.secret.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* <Separator /> */}

                {/* Author & Timestamps */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-blue-500" />
                    Timeline & Attribution
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-violet-500" />
                          <span className="text-sm">{incidentDetail.secret.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-pink-500" />
                          <span className="text-sm">{incidentDetail.secret.email}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">
                            Created: {format(new Date(incidentDetail.created_at), 'PPp')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">
                            Updated: {format(new Date(incidentDetail.updated_at), 'PPp')}
                          </span>
                        </div>
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

export default withAPIRequest(IncidentDetailDialog);
