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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUpDown,
  MoreVertical,
  Shield,
  AlertTriangle,
  ExternalLink,
  FileText,
  GitCommit,
  Clock,
  User,
  Calendar,
  AlertOctagon,
  Info,
  AlertCircle,
  Key,
  CheckCircle,
  HelpCircle,
  X,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ShieldIcon,
  GitFork,
  KeyIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAMPM } from '@/utils/commonFunctions';
import IncidentDetailDialog from '../dialogs/IncidentDetailDialog';
import RepositoryDetailDialog from '../../asset/dialogs/repository/RepositoryDetailDialog';
import SecretDetailDialog from '../../asset/dialogs/secrets/SecretDetailDialog';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { useToast } from '@/hooks/use-toast';
import AddAllowlistFromIncident from '../dialogs/AddAllowlistFromIncident';

interface Incident {
  id: number;
  name: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
  secret: {
    file: string;
    rule: string;
    severity: string;
    description: string;
    author: string;
    email: string;
    commit: string;
    date: string;
  };
  repository: {
    id: number;
    name: string;
    repoUrl: string;
    author: string;
  };
}

interface BulkStatusUpdateRequest {
  incident_ids: number[];
  status: 'open' | 'in-progress' | 'closed';
}

const IncidentsTable = ({
  incidents,
  isLoading,
  limit,
  handleOrderChange,
  handleSortByChange,
  onSuccess,
  commonAPIRequest,
}: {
  incidents: Incident[];
  isLoading: boolean;
  limit: number;
  handleOrderChange: () => void;
  handleSortByChange: (field: string) => void;
  onSuccess: () => void;
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedSecret, setSelectedSecret] = React.useState<Secret | null>(null);

  const [isRepoDialogOpen, setIsRepoDialogOpen] = React.useState(false);
  const [selectedRepoId, setSelectedRepoId] = React.useState<number | null>(null);

  const [selectedIncidentId, setSelectedIncidentId] = React.useState<number | null>(null);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = React.useState(false);

  const [selectedIncidents, setSelectedIncidents] = React.useState<{ id: number; name: string }[]>(
    []
  );

  const [allowlistDialogOpen, setAllowlistDialogOpen] = React.useState(false);
  const [selectedIncidentForAllowlist, setSelectedIncidentForAllowlist] =
    React.useState<string>('');

  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    status: 'open' | 'in-progress' | 'closed' | null;
    count: number;
  }>({
    isOpen: false,
    status: null,
    count: 0,
  });

  const { toast } = useToast();

  const handleViewSecretDetails = (secret: Secret) => {
    setSelectedSecret(secret);
    setDialogOpen(true);
  };

  const handleOpenRepoDialog = (repoId: number) => {
    setSelectedRepoId(repoId);
    setIsRepoDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIncidents =
        incidents?.map((incident) => ({
          id: incident.id,
          name: incident.name,
        })) || [];

      const existingIds = new Set(selectedIncidents.map((row) => row.id));
      const newSelections = currentPageIncidents.filter(
        (incident) => !existingIds.has(incident.id)
      );

      setSelectedIncidents((prev) => [...prev, ...newSelections]);
    } else {
      const currentPageIds = new Set(incidents?.map((incident) => incident.id) || []);
      setSelectedIncidents((prev) => prev.filter((row) => !currentPageIds.has(row.id)));
    }
  };

  const handleBulkStatusUpdate = async (status: 'open' | 'in-progress' | 'closed') => {
    try {
      // Prepare the request data
      const requestData: BulkStatusUpdateRequest = {
        incident_ids: selectedIncidents.map((incident) => incident.id),
        status,
      };

      const endpoint = API_ENDPOINTS.incidents.bulkUpdateStatus;
      const apiUrl = createEndpointUrl(endpoint);

      // Make the API call
      await commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
          data: requestData,
        },
        (response) => {
          if (response) {
            // Show success toast
            toast({
              title: (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Status Updated</span>
                </div>
              ),
              description: `Successfully updated ${selectedIncidents.length} incidents`,
              className:
                'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800',
            });

            // Clear selection
            setSelectedIncidents([]);
            // Refresh data
            onSuccess?.();
          } else {
            // Show error toast
            toast({
              title: (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>Update Failed</span>
                </div>
              ),
              description: 'Failed to update incident statuses',
              variant: 'destructive',
              className: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
            });
          }
        }
      );
    } catch (error) {
      // Show error toast
      toast({
        title: (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Error</span>
          </div>
        ),
        description: 'Something went wrong, please try again',
        variant: 'destructive',
        className: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
      });
      console.error('Error updating statuses:', error);
    }
  };

  const areAllCurrentPageItemsSelected =
    incidents?.every((incident) =>
      selectedIncidents.some((selected) => selected.id === incident.id)
    ) && incidents?.length > 0;

  const handleSelectRow = (checked: boolean, incident: { id: number; name: string }) => {
    if (checked) {
      setSelectedIncidents((prev) => [...prev, incident]);
    } else {
      setSelectedIncidents((prev) => prev.filter((row) => row.id !== incident.id));
    }
  };

  const getSecretTypeBadge = (rule: string) => {
    switch (rule) {
      case 'private-key':
        return {
          icon: Shield,
          className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
          label: 'Private Key',
        };
      case 'aws-access-token':
        return {
          icon: Key,
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          label: 'AWS Token',
        };
      default:
        return {
          icon: AlertTriangle,
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          label: rule,
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          icon: AlertOctagon,
          className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          label: 'Critical',
        };
      case 'high':
        return {
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
          label: 'High',
        };
      case 'medium':
        return {
          icon: AlertCircle,
          className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          label: 'Medium',
        };
      default:
        return {
          icon: Info,
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          label: severity,
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return {
          icon: AlertCircle,
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          label: 'Open',
        };
      case 'in-progress':
        return {
          icon: Clock,
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          label: 'In Progress',
        };
      case 'closed':
        return {
          icon: CheckCircle,
          className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          label: 'Closed',
        };
      default:
        return {
          icon: HelpCircle,
          className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          label: status,
        };
    }
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={7} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 ml-4 space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </TableCell>
    </TableRow>
  );

  // Create the confirmation dialog component
  const StatusUpdateConfirmDialog = () => (
    <AlertDialog
      open={confirmDialog.isOpen}
      onOpenChange={(open) => !open && setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to update {confirmDialog.count} incidents to{' '}
            <Badge variant="secondary" className="font-normal">
              {confirmDialog.status === 'open' && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-blue-500" />
                  Open
                </span>
              )}
              {confirmDialog.status === 'in-progress' && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  In Progress
                </span>
              )}
              {confirmDialog.status === 'closed' && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Closed
                </span>
              )}
            </Badge>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (confirmDialog.status) {
                handleBulkStatusUpdate(confirmDialog.status);
              }
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Update Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16">
          {/* Icon Container with Gradient */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-500/5 dark:to-blue-500/5 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 p-6 rounded-full">
              <Shield className="w-12 h-12 text-violet-600/90 dark:text-violet-400/90" />
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
            No Security Incidents Found
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            No security incidents have been detected yet. This could mean your code is secure, or
            you might need to configure more scans.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {selectedIncidents.length > 0 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Incidents</span>
                  <Badge variant="secondary" className="font-mono">
                    {selectedIncidents.length}
                  </Badge>
                </div>

                {selectedIncidents.length > 1 && (
                  <button
                    onClick={() => setSelectedIncidents([])}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Update Status
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          status: 'open',
                          count: selectedIncidents.length,
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span>Open</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          status: 'in-progress',
                          count: selectedIncidents.length,
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>In Progress</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          status: 'closed',
                          count: selectedIncidents.length,
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Closed</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                  // onClick={() => handleBulkExport()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            <hr className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <div className="flex flex-wrap gap-2">
              {selectedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="group flex items-center gap-1.5 bg-background text-sm px-3 py-1.5 rounded-full border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[200px] truncate">{incident.name}</span>
                  <button
                    onClick={() => handleSelectRow(false, incident)}
                    className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    aria-label={`Remove  ${incident.name} from selection`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden custom-scrollbar">
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
                  onClick={() => handleSortByChange('name')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <Shield className="mr-2 h-4 w-4 text-violet-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  Secret
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('repository')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <GitFork className="mr-2 h-4 w-4 text-violet-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  Repository
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('author')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <User className="mr-2 h-4 w-4 text-violet-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  Author
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('severity')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <AlertTriangle className="mr-2 h-4 w-4 text-violet-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  Severity
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  onClick={() => handleSortByChange('created_at')}
                  variant="ghost"
                  className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                >
                  <Calendar className="mr-2 h-4 w-4 text-violet-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  Detected
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-70" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : incidents.length === 0 ? (
              <EmptyState />
            ) : (
              incidents.map((incident) => (
                <TableRow key={incident.id} className="group hover:bg-muted/50">
                  <TableCell className="p-0 ps-2">
                    <div className="h-16 flex items-center justify-center">
                      <Checkbox
                        checked={selectedIncidents.some((row) => row.id === incident.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(checked as boolean, {
                            id: incident.id,
                            name: incident.name,
                          })
                        }
                        aria-label={`Select ${incident.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                      setIsIncidentDialogOpen(true);
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Name */}
                      <h4 className="font-medium text-sm">
                        {incident.name.length > 32
                          ? `${incident?.name?.slice(0, 32)}...`
                          : incident.name}
                      </h4>

                      {/* Badges Row */}
                      <div className="flex items-center gap-2">
                        {/* Secret Type Badge */}
                        {(() => {
                          const {
                            className,
                            icon: Icon,
                            label,
                          } = getSecretTypeBadge(incident.secret.rule);
                          return (
                            <Badge variant="outline" className={`${className} px-2 py-0.5`}>
                              <Icon className="mr-1 h-3 w-3" />
                              {label}
                            </Badge>
                          );
                        })()}

                        {/* Status Badge */}
                        {(() => {
                          const { className, icon: Icon, label } = getStatusBadge(incident.status);
                          return (
                            <Badge variant="outline" className={`${className} px-2 py-0.5`}>
                              <Icon className="mr-1 h-3 w-3" />
                              {label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
                        <GitFork className="h-5 w-5 text-primary-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{incident.repository.name}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <code className="text-xs font-mono">
                            {incident?.secret?.commit?.slice(0, 7)}
                          </code>
                          {/* <a
                            href={incident.secret.repository.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 p-1 hover:bg-primary-50 rounded-md transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a> */}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{incident.secret.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {incident.secret.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const {
                        className,
                        icon: Icon,
                        label,
                      } = getSeverityBadge(incident.secret.severity);
                      return (
                        <Badge variant="outline" className={`${className} px-3 py-1`}>
                          <Icon className="mr-2 h-3 w-3" />
                          {label}
                        </Badge>
                      );
                    })()}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(incident.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatAMPM(new Date(incident.created_at))}
                        </span>
                      </div>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setIsIncidentDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Incident Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewSecretDetails(incident?.secret)}
                          className="flex items-center gap-2"
                        >
                          <KeyIcon className="h-4 w-4" />
                          View Secret Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenRepoDialog(incident?.repository?.id)}
                          className="flex items-center gap-2"
                        >
                          <GitFork className="h-4 w-4" />
                          View Repo Details
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedIncidentForAllowlist(incident.name);
                            setAllowlistDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <ShieldIcon className="h-4 w-4" />
                          Add Allowlist Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  {selectedIncidentId && (
                    <IncidentDetailDialog
                      open={isIncidentDialogOpen}
                      onOpenChange={setIsIncidentDialogOpen}
                      incidentId={selectedIncidentId!}
                      repository={incident.secret?.repository}
                    />
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {selectedSecret && (
        <SecretDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          secretId={selectedSecret?.id}
        />
      )}

      {selectedRepoId && (
        <RepositoryDetailDialog
          open={isRepoDialogOpen}
          onOpenChange={setIsRepoDialogOpen}
          repoId={selectedRepoId!}
        />
      )}

      <AddAllowlistFromIncident
        open={allowlistDialogOpen}
        onOpenChange={setAllowlistDialogOpen}
        incidentName={selectedIncidentForAllowlist}
        commonAPIRequest={commonAPIRequest}
        onSuccess={() => {
          setAllowlistDialogOpen(false);
          onSuccess?.();
        }}
        type="SECRET"
      />

      <StatusUpdateConfirmDialog />
    </>
  );
};

export default withAPIRequest(IncidentsTable);
