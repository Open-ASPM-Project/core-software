import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  ExternalLink,
} from 'lucide-react';
import EditCloudConfigDialog from '../../../dialogs/sources/cloud/EditCloudConfigDialog';
import DeleteCloudConfigDialog from '../../../dialogs/sources/cloud/DeleteCloudConfigDialog';
import { CloudType } from '../../../types/cloud';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface CloudProviderConfig {
  label: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  description: string;
  logoPlaceholder: string;
}

interface CloudConfig {
  id: number;
  uuid: string;
  type: string;
  name: string;
  cloudType: CloudType;
  cloudTypeLabel: string;
  sourceType: string;
  awsAccessKey: string | null;
  awsSecretKey: string | null;
  gcpServiceAccountKey: string | null;
  clientId: string | null;
  clientSecret: string | null;
  tenantId: string | null;
  subscriptionId: string | null;
  digitaloceanToken: string | null;
  scalewayAccessKey: string | null;
  scalewayAccessToken: string | null;
  apiKey: string | null;
  email: string | null;
  herokuApiToken: string | null;
  fastlyApiKey: string | null;
  linodePersonalAccessToken: string | null;
  namecheapApiKey: string | null;
  namecheapUserName: string | null;
  alibabaRegionId: string | null;
  alibabaAccessKey: string | null;
  alibabaAccessKeySecret: string | null;
  tfStateFile: string | null;
  consulUrl: string | null;
  nomadUrl: string | null;
  authToken: string | null;
  kubeconfigFile: string | null;
  kubeconfigEncoded: string | null;
  dnssimpleApiToken: string | null;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  addedByUid: number;
  updatedByUid: number;
  scheduleId: number | null;
}

interface CloudConfigResponse {
  current_page: number;
  current_limit: number;
  total_count: number;
  total_pages: number;
  data: CloudConfig[];
}

interface CloudConfigGridProps {
  data: CloudConfigResponse;
  isLoading?: boolean;
  onSuccess: () => void;
  commonAPIRequest: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const cloudTypeConfig: Record<CloudType, CloudProviderConfig> = {
  aws: {
    label: 'Amazon Web Services',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    accentColor: 'border-orange-200 dark:border-orange-800',
    description: 'AWS cloud infrastructure and services',
    logoPlaceholder: '🌩️',
  },
  gcp: {
    label: 'Google Cloud Platform',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    accentColor: 'border-blue-200 dark:border-blue-800',
    description: 'Google cloud infrastructure and services',
    logoPlaceholder: '☁️',
  },
  azure: {
    label: 'Microsoft Azure',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    accentColor: 'border-indigo-200 dark:border-indigo-800',
    description: 'Microsoft cloud infrastructure and services',
    logoPlaceholder: '⚡',
  },
  do: {
    label: 'DigitalOcean',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    accentColor: 'border-cyan-200 dark:border-cyan-800',
    description: 'Cloud infrastructure for developers',
    logoPlaceholder: '🌊',
  },
  scw: {
    label: 'Scaleway',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    accentColor: 'border-purple-200 dark:border-purple-800',
    description: 'European cloud infrastructure provider',
    logoPlaceholder: '🚀',
  },
  arvancloud: {
    label: 'ArvanCloud',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    accentColor: 'border-teal-200 dark:border-teal-800',
    description: 'Iranian cloud services provider',
    logoPlaceholder: '☁️',
  },
  cloudflare: {
    label: 'Cloudflare',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    accentColor: 'border-amber-200 dark:border-amber-800',
    description: 'Web infrastructure and security',
    logoPlaceholder: '🛡️',
  },
  heroku: {
    label: 'Heroku',
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    accentColor: 'border-fuchsia-200 dark:border-fuchsia-800',
    description: 'Cloud platform as a service',
    logoPlaceholder: '🟣',
  },
  fastly: {
    label: 'Fastly',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-600 dark:text-rose-400',
    accentColor: 'border-rose-200 dark:border-rose-800',
    description: 'Edge cloud platform',
    logoPlaceholder: '⚡',
  },
  linode: {
    label: 'Linode',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    accentColor: 'border-green-200 dark:border-green-800',
    description: 'Cloud computing services',
    logoPlaceholder: '🟢',
  },
  namecheap: {
    label: 'Namecheap',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    accentColor: 'border-red-200 dark:border-red-800',
    description: 'Domain registrar and web host',
    logoPlaceholder: '🔖',
  },
  alibaba: {
    label: 'Alibaba Cloud',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    accentColor: 'border-orange-200 dark:border-orange-800',
    description: 'Chinese cloud computing services',
    logoPlaceholder: '☁️',
  },
  terraform: {
    label: 'Terraform',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    accentColor: 'border-violet-200 dark:border-violet-800',
    description: 'Infrastructure as code',
    logoPlaceholder: '🏗️',
  },
  consul: {
    label: 'Consul',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    accentColor: 'border-pink-200 dark:border-pink-800',
    description: 'Service networking platform',
    logoPlaceholder: '🔍',
  },
  nomad: {
    label: 'Nomad',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    textColor: 'text-lime-600 dark:text-lime-400',
    accentColor: 'border-lime-200 dark:border-lime-800',
    description: 'Workload orchestrator',
    logoPlaceholder: '🎯',
  },
  hetzner: {
    label: 'Hetzner',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    accentColor: 'border-red-200 dark:border-red-800',
    description: 'German cloud provider',
    logoPlaceholder: '🇩🇪',
  },
  kubernetes: {
    label: 'Kubernetes',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    accentColor: 'border-sky-200 dark:border-sky-800',
    description: 'Container orchestration platform',
    logoPlaceholder: '⚓',
  },
  dnssimple: {
    label: 'DNSimple',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    accentColor: 'border-emerald-200 dark:border-emerald-800',
    description: 'DNS and domain management',
    logoPlaceholder: '🔍',
  },
};

const CloudConfigGrid = ({
  data,
  isLoading,
  onSuccess,
  commonAPIRequest,
}: CloudConfigGridProps) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    config: CloudConfig | null;
  }>({
    isOpen: false,
    config: null,
  });

  const [editDialog, setEditDialog] = React.useState<{
    isOpen: boolean;
    config: CloudConfig | null;
  }>({
    isOpen: false,
    config: null,
  });

  const handleEditClick = (config: CloudConfig) => {
    setEditDialog({
      isOpen: true,
      config,
    });
  };

  const handleDeleteClick = (config: CloudConfig) => {
    setDeleteDialog({
      isOpen: true,
      config,
    });
  };

  const getStatusConfig = (active: boolean) => ({
    icon: active ? CheckCircle2 : XCircle,
    className: active
      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    label: active ? 'Active' : 'Inactive',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {data.data.map((config) => {
        const cloudConfig = cloudTypeConfig[config.cloudType] || cloudTypeConfig.aws;
        const statusConfig = getStatusConfig(config.active);

        return (
          <Card
            key={config.id}
            className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${cloudConfig.accentColor}`}
          >
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${cloudConfig.bgColor}`}>
                    <span className="text-2xl" role="img" aria-label={cloudConfig.label}>
                      {cloudConfig.logoPlaceholder}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{config.name}</h3>
                    <p className={`text-sm ${cloudConfig.textColor}`}>{config.cloudTypeLabel}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditClick(config)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(config)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-4">
              <p className="text-sm text-muted-foreground mb-4">{cloudConfig.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={statusConfig.className}>
                  <statusConfig.icon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  <Key className="h-3 w-3 mr-1" />
                  {config.uuid.slice(0, 8)}
                </Badge>
              </div>
            </CardContent>

            <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Updated
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last updated on {formatDate(config.updatedAt)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Details
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View cloud configuration details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {editDialog.config && (
        <EditCloudConfigDialog
          config={editDialog.config}
          open={editDialog.isOpen}
          onOpenChange={(open: boolean) =>
            setEditDialog({ isOpen: open, config: editDialog.config })
          }
          onSuccess={onSuccess}
          commonAPIRequest={commonAPIRequest}
        />
      )}

      {deleteDialog.config && (
        <DeleteCloudConfigDialog
          config={deleteDialog.config}
          open={deleteDialog.isOpen}
          onOpenChange={(open: boolean) =>
            setDeleteDialog({ isOpen: open, config: deleteDialog.config })
          }
          onSuccess={onSuccess}
          commonAPIRequest={commonAPIRequest}
        />
      )}
    </div>
  );
};

export default withAPIRequest(CloudConfigGrid);
