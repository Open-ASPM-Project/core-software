import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  Package,
  FolderGit2,
  Clock,
  RefreshCw,
  Bug,
  AlertTriangle,
  AlertCircle,
  MoreVertical,
  ShieldCheck,
  FileText,
  ShieldIcon,
} from 'lucide-react';
import { ScaIncident } from '../hooks/useScaKanban';
import React from 'react';
import RepositoryDetailDialog from '@/pages/secrets-app/asset/dialogs/repository/RepositoryDetailDialog';
import VulnerabilityDetailDialog from '@/pages/sca-app/asset/dialogs/vulnerabilities/VulnerabilityDetailDialog';
import ScaIncidentDetailDialog from '../../dialogs/ScaIncidentDetailDialog';
import AddAllowlistFromIncident from '@/pages/secrets-app/incidents/dialogs/AddAllowlistFromIncident';
// import RepositoryDetailDialog from '@/pages/secrets-app/asset/dialogs/repository/RepositoryDetailDialog';
// import IncidentDetailDialog from '../../dialogs/IncidentDetailDialog';
// import VulnerabilityDetailDialog from '../../dialogs/VulnerabilityDetailDialog';

interface ScaIncidentTaskCardProps {
  incident: ScaIncident;
  dragHandleProps?: any;
}

export const ScaIncidentTaskCard = ({ incident, dragHandleProps }: ScaIncidentTaskCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isRepoDialogOpen, setIsRepoDialogOpen] = React.useState(false);
  const [selectedRepoId, setSelectedRepoId] = React.useState<number | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<number | null>(null);

  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = React.useState(false);
  const [isVulnerabilityDialogOpen, setIsVulnerabilityDialogOpen] = React.useState(false);

  const [allowlistDialogOpen, setAllowlistDialogOpen] = React.useState(false);
  const [selectedIncidentForAllowlist, setSelectedIncidentForAllowlist] =
    React.useState<string>('');

  const handleOpenRepoDialog = (repoId: number) => {
    setSelectedRepoId(repoId);
    setIsRepoDialogOpen(true);
  };

  const getStatusStyles = (status: string) => {
    const styles = {
      open: {
        badge: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        dot: 'bg-red-500',
        border: 'border-l-red-500',
      },
      'in-progress': {
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
        dot: 'bg-purple-500',
        border: 'border-l-purple-500',
      },
      closed: {
        badge: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        dot: 'bg-green-500',
        border: 'border-l-green-500',
      },
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  const getSeverityStyles = (severity: string) => {
    const styles = {
      critical: {
        badge: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        icon: 'text-red-500',
      },
      high: {
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
        icon: 'text-orange-500',
      },
      medium: {
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
        icon: 'text-yellow-500',
      },
      low: {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        icon: 'text-blue-500',
      },
      unknown: {
        badge: 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
        icon: 'text-gray-500',
      },
    };
    return styles[severity.toLowerCase() as keyof typeof styles] || styles.unknown;
  };

  const statusStyle = getStatusStyles(incident.status);
  const severityStyle = getSeverityStyles(incident.vulnerability.severity);

  return (
    <Card
      className={`bg-background hover:shadow-md transition-all duration-200 border-l-4 ${statusStyle.border}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing hover:text-purple-500 transition-colors mt-1"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <h3
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setIsIncidentDialogOpen(true);
                          }}
                          className="font-semibold text-md truncate max-w-[180px]"
                        >
                          {incident.name}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent>{incident.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyle.badge}`}
                  >
                    {incident.type} • {incident.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center min-w-[96px] justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                    <DropdownMenuItem onClick={() => setIsVulnerabilityDialogOpen(true)}>
                      <Bug className="h-4 w-4 mr-2" />
                      View Vulnerability Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenRepoDialog(incident?.vulnerability?.repository_id)}
                    >
                      <FolderGit2 className="h-4 w-4 mr-2" />
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
                      Add Allowlist
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem
                      onClick={() => {
                        setSelectedIncidentId(incident.id);
                        setIsIncidentDialogOpen(true);
                      }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      View Incident Details
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Package and Severity Info */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
              <div className="min-w-0 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="block text-left">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {`${incident.vulnerability.package}@${incident.vulnerability.package_version}`
                            .length > 20
                            ? `${incident.vulnerability.package}@${incident.vulnerability.package_version}`.slice(
                                0,
                                20
                              ) + '...'
                            : `${incident.vulnerability.package}@${incident.vulnerability.package_version}`}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent style={{ width: '25%' }}>
                      {incident.vulnerability.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className={`${severityStyle.badge} capitalize`}>
                  <AlertTriangle className={`h-3 w-3 mr-1 ${severityStyle.icon}`} />
                  {incident.vulnerability.severity}
                </Badge>
                {incident.vulnerability.fix_available && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>Fix Available</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(incident.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{formatDate(incident.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRepoId && (
        <RepositoryDetailDialog
          open={isRepoDialogOpen}
          onOpenChange={setIsRepoDialogOpen}
          repoId={selectedRepoId}
        />
      )}

      {selectedIncidentId && incident?.vulnerability?.repository && (
        <ScaIncidentDetailDialog
          open={isIncidentDialogOpen}
          onOpenChange={setIsIncidentDialogOpen}
          incidentId={selectedIncidentId}
          repository={incident?.vulnerability?.repository!}
        />
      )}

      {incident.vulnerability && (
        <VulnerabilityDetailDialog
          open={isVulnerabilityDialogOpen}
          onOpenChange={setIsVulnerabilityDialogOpen}
          vulnerabilityId={incident.vulnerability.id}
        />
      )}

      <AddAllowlistFromIncident
        open={allowlistDialogOpen}
        onOpenChange={setAllowlistDialogOpen}
        incidentName={selectedIncidentForAllowlist}
        // commonAPIRequest={commonAPIRequest}
        onSuccess={() => {
          setAllowlistDialogOpen(false);
          // onSuccess?.();
        }}
        type="VULNERABILITY"
      />
    </Card>
  );
};
