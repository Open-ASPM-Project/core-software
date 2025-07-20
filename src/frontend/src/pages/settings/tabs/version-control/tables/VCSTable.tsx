import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Github,
  Gitlab,
  MoreHorizontal,
  Settings,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link2,
  RefreshCw,
  KeyRound,
  Bug,
  GitBranch,
} from 'lucide-react';
import DeleteVCSDialog from '../dialogs/DeleteVCSDialog';
import EditVCSDialog from '../dialogs/EditVCSDialog';
import ConfigureWebhookDialog from '../dialogs/ConfigureWebhookDialog';
import { toast } from 'sonner';
import { API_BASE_URLS } from '@/config/api.config';

export type VCSType = 'github' | 'bitbucket' | 'gitlab';

export interface VCSConfig {
  id: number;
  name: string;
  description: string;
  type: VCSType;
  token: string;
  url: string;
  added_by_user_id: number;
  created_by: number;
  updated_by: number;
  active: boolean;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface VCSTableProps {
  data: VCSConfig[];
  isLoading?: boolean;
  pagination: PaginationProps;
  onEdit?: (config: VCSConfig) => void;
  onConfigure?: (config: VCSConfig) => void;
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
}

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={5} className="h-96">
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 p-4 rounded-full mb-4">
          <GitBranch className="w-12 h-12 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-center">
          No Version Control Configurations Found
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          There are currently no version control configurations available. Add a new configuration
          to start managing your repositories.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export const VCSTable: React.FC<VCSTableProps> = ({
  data,
  isLoading,
  pagination,
  onConfigure,
  commonAPIRequest,
  onSuccess,
}) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    vcs: { id: number; name: string; type: VCSType } | null;
  }>({
    isOpen: false,
    vcs: null,
  });

  const [editDialog, setEditDialog] = React.useState<{
    isOpen: boolean;
    vcs: VCSConfig | null;
  }>({
    isOpen: false,
    vcs: null,
  });

  const [webhookDialog, setWebhookDialog] = React.useState<{
    isOpen: boolean;
    vcsId: number | null;
    vcsType: string;
  }>();

  const handleEditClick = (vcs: VCSConfig) => {
    setEditDialog({
      isOpen: true,
      vcs,
    });
  };

  const handleDeleteClick = (vcs: { id: number; name: string; type: VCSType }) => {
    setDeleteDialog({
      isOpen: true,
      vcs,
    });
  };

  const handleVulnerabilitiesScanAgain = async (config: VCSConfig) => {
    // Loading toast
    const toastId = toast.loading(`Starting scan for ${config.name}...`);

    try {
      await commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/vulnerabilities/scan/vcs/${config.id}`,
          method: 'POST',
          data: {
            vcs_id: config.id,
          },
        },
        (response: any) => {
          if (response) {
            toast.success('Scan started successfully', {
              id: toastId,
              description: `Scan initiated for VCS integration ${config.name}`,
            });
          } else {
            toast.error('Failed to start scan', {
              id: toastId,
              description: 'There was an error starting the VCS scan',
            });
          }
        }
      );
    } catch (error) {
      toast.error('Failed to start scan', {
        id: toastId,
        description: 'There was an error starting the VCS scan',
      });
    }
  };

  const handleScanSecrets = async (config: VCSConfig) => {
    // Loading toast
    const toastId = toast.loading(`Starting secrets scan for ${config.name}...`);

    try {
      await commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/repo/scan/all`,
          method: 'POST',
          data: {
            vc_id: config.id,
          },
        },
        (response: any) => {
          if (response) {
            toast.success('Secrets scan started successfully', {
              id: toastId,
              description: `Secrets scan initiated for VCS integration ${config.name}`,
            });
          } else {
            toast.error('Failed to start secrets scan', {
              id: toastId,
              description: 'There was an error starting the secrets scan',
            });
          }
        }
      );
    } catch (error) {
      toast.error('Failed to start secrets scan', {
        id: toastId,
        description: 'There was an error starting the secrets scan',
      });
    }
  };

  const handleConfigureClick = (config: VCSConfig) => {
    // Show the webhook configuration dialog
    setWebhookDialog({
      isOpen: true,
      vcsId: config.id,
      vcsType: config.type,
    });
  };

  const getVCSTypeIcon = (type: VCSType) => {
    const icons = {
      github: {
        icon: Github,
        bgColor: 'bg-purple-100 dark:bg-purple-900',
        textColor: 'text-purple-700 dark:text-purple-300',
      },
      gitlab: {
        icon: Gitlab,
        bgColor: 'bg-orange-100 dark:bg-orange-900',
        textColor: 'text-orange-700 dark:text-orange-300',
      },
      bitbucket: {
        icon: () => (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.22 4.984a.4.4 0 00-.399.458l3.138 18.655a.545.545 0 00.533.456h15.013a.4.4 0 00.4-.33l3.138-18.781a.4.4 0 00-.4-.458H1.22zm7.541 12.46H6.012L4.711 9.893h4.346l-.294 7.551zm8.834-7.551l-1.303 7.551h-2.745l-.294-7.551h4.342z" />
          </svg>
        ),
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        textColor: 'text-blue-700 dark:text-blue-300',
      },
    };

    const IconComponent = icons[type].icon;
    return (
      <div className={`rounded-full ${icons[type].bgColor} p-1.5`}>
        <IconComponent className={`h-5 w-5 ${icons[type].textColor}`} />
      </div>
    );
  };

  const getStatusConfig = (active: boolean) => ({
    icon: active ? CheckCircle2 : XCircle,
    className: active
      ? 'bg-green-50 text-green-700  dark:bg-green-950 dark:text-green-400'
      : 'bg-red-50 text-red-700  dark:bg-red-950 dark:text-red-400',
    label: active ? 'Active' : 'Inactive',
  });

  const Pagination: React.FC = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        <p>
          Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
          {pagination.totalCount} results
        </p>
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex hover:bg-violet-50 dark:hover:bg-violet-900"
            onClick={() => pagination.onPageChange(1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hover:bg-violet-50 dark:hover:bg-violet-900"
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hover:bg-violet-50 dark:hover:bg-violet-900"
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex hover:bg-violet-50 dark:hover:bg-violet-900"
            onClick={() => pagination.onPageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[100px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <EmptyState />
                ) : (
                  data.map((config) => {
                    const statusConfig = getStatusConfig(config.active);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={config.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-violet-100 p-1 dark:bg-violet-900">
                              <Link2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            {config.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={config.description}>
                          {config.description}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getVCSTypeIcon(config.type)}
                            <span className="capitalize">{config.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusConfig.className} px-2 py-1`}
                          >
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{statusConfig.label}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-violet-50 dark:hover:bg-violet-900"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditClick(config);
                                }}
                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleConfigureClick(config);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Settings className="h-4 w-4" />
                                Configure
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleScanSecrets(config);
                                }}
                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
                              >
                                <KeyRound className="h-4 w-4" />
                                Scan Secrets
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVulnerabilitiesScanAgain(config);
                                }}
                                className="flex items-center gap-2 text-green-600 dark:text-green-400"
                              >
                                <Bug className="h-4 w-4" />
                                Scan Vulnerabilities
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteClick({
                                    id: config.id,
                                    name: config.name,
                                    type: config.type,
                                  });
                                }}
                                className="flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {editDialog.vcs && (
                            <EditVCSDialog
                              isOpen={editDialog.isOpen}
                              onClose={() => setEditDialog({ isOpen: false, vcs: null })}
                              onSuccess={onSuccess}
                              vcs={editDialog.vcs}
                            />
                          )}
                          {deleteDialog.vcs && (
                            <DeleteVCSDialog
                              isOpen={deleteDialog.isOpen}
                              onClose={() => setDeleteDialog({ isOpen: false, vcs: null })}
                              onSuccess={onSuccess}
                              vcs={deleteDialog.vcs}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </div>
      </CardContent>

      {webhookDialog?.vcsId && (
        <ConfigureWebhookDialog
          isOpen={webhookDialog.isOpen}
          onClose={() => setWebhookDialog({ isOpen: false, vcsId: null, vcsType: '' })}
          onSuccess={onSuccess}
          vcsId={webhookDialog.vcsId}
          vcsType={webhookDialog.vcsType}
        />
      )}
    </Card>
  );
};

export default VCSTable;
