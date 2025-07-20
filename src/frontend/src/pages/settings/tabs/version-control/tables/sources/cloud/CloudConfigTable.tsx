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
  Cloud,
  RefreshCw,
  Key,
} from 'lucide-react';
import EditCloudConfigDialog from '../../../dialogs/sources/cloud/EditCloudConfigDialog';
import DeleteCloudConfigDialog from '../../../dialogs/sources/cloud/DeleteCloudConfigDialog';
// import DeleteCloudConfigDialog from '../dialogs/DeleteCloudConfigDialog';
// import EditCloudConfigDialog from '../dialogs/EditCloudConfigDialog';

export type CloudType = 'aws' | 'azure' | 'gcp';

export interface CloudConfig {
  id: number;
  uuid: string;
  sourceType: string;
  name: string;
  cloudType: CloudType;
  clientId: string;
  clientSecret: string;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  addedByUid: number;
  updatedByUid: number;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface CloudConfigTableProps {
  data: CloudConfig[];
  isLoading?: boolean;
  pagination: PaginationProps;
  onEdit?: (config: CloudConfig) => void;
  onSuccess: () => void;
}

export const CloudConfigTable: React.FC<CloudConfigTableProps> = ({
  data,
  isLoading,
  pagination,
  onSuccess,
}) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    config: { id: number; name: string; cloudType: CloudType; uuid: string } | null;
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

  const handleDeleteClick = (config: {
    id: number;
    name: string;
    cloudType: CloudType;
    uuid: string;
  }) => {
    setDeleteDialog({
      isOpen: true,
      config,
    });
  };

  const getCloudTypeStyles = (type: CloudType) => {
    const styles = {
      aws: {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-600 dark:text-orange-400',
        label: 'AWS',
      },
      azure: {
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        label: 'Azure',
      },
      gcp: {
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        label: 'GCP',
      },
    };

    return styles[type] || styles.aws;
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
            className="hidden h-8 w-8 p-0 lg:flex hover:bg-indigo-50 dark:hover:bg-indigo-900"
            onClick={() => pagination.onPageChange(1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900"
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900"
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex hover:bg-indigo-50 dark:hover:bg-indigo-900"
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
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
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
                <TableRow className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950 dark:to-cyan-950">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Provider</TableHead>
                  <TableHead className="font-semibold">Client ID</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Added On</TableHead>
                  <TableHead className="w-[100px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((config) => {
                  const statusConfig = getStatusConfig(config.active);
                  const StatusIcon = statusConfig.icon;
                  const cloudStyles = getCloudTypeStyles(config.cloudType);

                  return (
                    <TableRow key={config.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-indigo-100 p-1 dark:bg-indigo-900">
                            <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          {config.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-sm ${cloudStyles.bgColor}`}
                          >
                            <span className={`text-xs font-medium ${cloudStyles.textColor}`}>
                              {cloudStyles.label}
                            </span>
                          </div>
                          <span className="capitalize">{config.cloudType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            {config.clientId.length > 10
                              ? `${config.clientId.substring(0, 10)}...`
                              : config.clientId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusConfig.className} px-2 py-1`}>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span>{statusConfig.label}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(config.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-indigo-50 dark:hover:bg-indigo-900"
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
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick({
                                  id: config.id,
                                  name: config.name,
                                  cloudType: config.cloudType,
                                  uuid: config?.uuid,
                                });
                              }}
                              className="flex items-center gap-2 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination />
        </div>
      </CardContent>

      {editDialog.config && (
        <EditCloudConfigDialog
          isOpen={editDialog.isOpen}
          onClose={() => setEditDialog({ isOpen: false, config: null })}
          cloudConfig={{
            id: editDialog.config.uuid,
            name: editDialog.config.name,
            active: editDialog.config.active,
            sourceType: editDialog.config.sourceType,
            cloud: {
              cloudType: editDialog.config.cloudType,
              clientId: editDialog.config.clientId,
              clientSecret: editDialog.config.clientSecret,
            },
          }}
          onSuccess={onSuccess}
        />
      )}

      {deleteDialog.config && (
        <DeleteCloudConfigDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, config: null })}
          config={deleteDialog.config}
          onSuccess={onSuccess}
        />
      )}
    </Card>
  );
};

export default CloudConfigTable;
