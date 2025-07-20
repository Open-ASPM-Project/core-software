import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  KeyRound,
  Globe,
  RefreshCcw,
  ArrowUpDown,
  CircleDot,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import EditSSOConfigDialog from '../dialogs/EditSSOConfigDialog';
import DeleteSSOConfigDialog from '../dialogs/DeleteSSOConfigDialog';

interface SSOConfigData {
  name: string;
  type: 'Okta' | 'Azure' | 'Google';
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface SSOConfig {
  id: number;
  name: string;
  type: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface SSOConfigTableProps {
  ssoConfigs: SSOConfig[];
  isLoading: boolean;
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

const SSOConfigTable: React.FC<SSOConfigTableProps> = ({
  ssoConfigs,
  isLoading,
  onSuccess,
  commonAPIRequest,
}) => {
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [sortField, setSortField] = useState<keyof SSOConfig>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SSOConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const toggleSecret = (id: number) => {
    setShowSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSSOTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'okta':
        return <CircleDot className="h-4 w-4 text-blue-500" />;
      case 'azure':
        return <Globe className="h-4 w-4 text-blue-600" />;
      case 'google':
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <KeyRound className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSort = (field: keyof SSOConfig) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortButton = (field: keyof SSOConfig, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="hover:bg-muted/50 -ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      <span>{label}</span>
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  // Add handleDelete function:
  const handleDelete = async (config: SSOConfig) => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.sso.deleteConfig;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: `${apiUrl}/${config.name}`,
        method: 'DELETE',
      },
      (response) => {
        if (response) {
          setDeleteDialogOpen(false);
          setSelectedConfig(null);
          onSuccess();
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">{renderSortButton('name', 'Name')}</TableHead>
            <TableHead>{renderSortButton('type', 'Type')}</TableHead>
            <TableHead>{renderSortButton('clientId', 'Client ID')}</TableHead>
            <TableHead>{renderSortButton('createdAt', 'Created At')}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ssoConfigs.map((config) => (
            <TableRow key={config.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  {getSSOTypeIcon(config.type)}
                  <span>{config.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {config.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">
                    {showSecrets[config.id] ? config.clientId : '••••••••••••'}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleSecret(config.id)}
                        >
                          {showSecrets[config.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showSecrets[config.id] ? 'Hide' : 'Show'} Client ID
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {format(new Date(config.createdAt), 'MMM d, yyyy')}
                    </TooltipTrigger>
                    <TooltipContent>{format(new Date(config.createdAt), 'PPpp')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedConfig(config);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Sync
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-rose-500"
                      onClick={() => {
                        setSelectedConfig(config);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditSSOConfigDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onSuccess}
        initialData={selectedConfig as SSOConfigData}
        commonAPIRequest={commonAPIRequest}
      />

      <DeleteSSOConfigDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={onSuccess}
        config={selectedConfig}
        commonAPIRequest={commonAPIRequest}
      />
    </div>
  );
};

export default withAPIRequest(SSOConfigTable);
