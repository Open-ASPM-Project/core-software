'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  Database,
  Server,
  Globe,
  Cloud,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Lock,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export interface User {
  active: boolean;
  userEmail: string;
  username: string;
  role: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  addedBy: null;
  updatedBy: null;
}

interface ServiceAssetMetadata {
  group_id?: string;
  group_name?: string;
  description?: string;
  engine?: string;
  instance_type?: string;
  region?: string;
  api_id?: string;
  stage?: string;
  name?: string;
  [key: string]: string | undefined;
}

interface ServiceAsset {
  uuid: string;
  type: string;
  metadata: ServiceAssetMetadata;
  createdAt: string;
  updatedAt: string;
  groupId?: string;
  groupName?: string;
  fromPorts?: number[] | null;
  name?: string;
  dnsName?: string;
  publicDnsName?: string;
  publicIpAddress?: string;
  endpointAddress?: string;
  endpointPort?: number;
  apiGatewayUrl?: string | null;
  domainAsset: DomainAsset | null;
  subdomainAsset: SubdomainAsset | null;
  webapps?: WebappAsset[];
  securityGroups?: SecurityGroup[];
}

interface DomainAsset {
  uuid: string;
  name: string;
  // Add other domain asset properties as needed
}

interface SubdomainAsset {
  uuid: string;
  name: string;
  // Add other subdomain asset properties as needed
}

interface WebappAsset {
  uuid: string;
  name: string;
  url: string;
  port: number;
  // Add other webapp asset properties as needed
}

interface SecurityGroup {
  uuid: string;
  groupId: string;
  groupName: string;
  fromPorts: number[] | null;
  // Add other security group properties as needed
}

interface ServiceAssetData {
  uuid: string;
  active: boolean;
  type: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  addedBy: User | null;
  updatedBy: User | null;
  serviceAsset: ServiceAsset;
  subType: string;
}

export interface PaginatedResponse {
  current_page: number;
  current_limit: number;
  total_count: number;
  total_pages: number;
  data: ServiceAssetData[];
}

interface VMServiceAssetTableProps {
  data: PaginatedResponse;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function VMServiceAssetTable({
  data,
  onPageChange,
  isLoading = false,
}: VMServiceAssetTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<{ uuid: string; name: string | null }[]>(
    []
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageAssets =
        data.data?.map((asset) => ({
          uuid: asset.uuid,
          name: asset.name || getAssetName(asset),
        })) || [];

      const existingIds = new Set(selectedRows.map((row) => row.uuid));
      const newSelections = currentPageAssets.filter((asset) => !existingIds.has(asset.uuid));

      setSelectedRows((prev) => [...prev, ...newSelections]);
    } else {
      const currentPageIds = new Set(data.data?.map((asset) => asset.uuid) || []);
      setSelectedRows((prev) => prev.filter((row) => !currentPageIds.has(row.uuid)));
    }
  };

  const handleSelectRow = (checked: boolean, asset: { uuid: string; name: string | null }) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, asset]);
    } else {
      setSelectedRows((prev) => prev.filter((row) => row.uuid !== asset.uuid));
    }
  };

  const areAllCurrentPageItemsSelected =
    data.data?.every((asset) => selectedRows.some((selected) => selected.uuid === asset.uuid)) &&
    data.data?.length > 0;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= data.total_pages) {
      onPageChange(page);
    }
  };

  const getAssetIcon = (subType: string) => {
    switch (subType) {
      case 'aws_vpc_security_group':
        return <Shield className="h-4 w-4" />;
      case 'aws_rds_db_instance':
        return <Database className="h-4 w-4" />;
      case 'aws_ec2_instance':
        return <Server className="h-4 w-4" />;
      case 'aws_route53_record':
        return <Globe className="h-4 w-4" />;
      case 'aws_s3_bucket':
        return <Warehouse className="h-4 w-4" />;
      case 'aws_api_gateway_rest_api':
      case 'aws_api_gateway_stage':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getAssetName = (asset: ServiceAssetData): string => {
    const sa = asset.serviceAsset;
    switch (asset.subType) {
      case 'aws_vpc_security_group':
        return sa.groupName || sa.groupId || 'Unnamed Security Group';
      case 'aws_rds_db_instance':
        return sa.endpointAddress || 'Unnamed RDS Instance';
      case 'aws_ec2_instance':
        return sa.publicDnsName || sa.publicIpAddress || 'Unnamed EC2 Instance';
      case 'aws_route53_record':
        return sa.name || 'Unnamed Route53 Record';
      case 'aws_s3_bucket':
        return sa.name || 'Unnamed S3 Bucket';
      case 'aws_api_gateway_rest_api':
      case 'aws_api_gateway_stage':
        return sa.metadata?.name || 'Unnamed API Gateway';
      default:
        return 'Unknown Service';
    }
  };

  const getAssetDetails = (asset: ServiceAssetData): JSX.Element => {
    const sa = asset.serviceAsset;
    switch (asset.subType) {
      case 'aws_vpc_security_group':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Group ID:</span>
              <span className="text-sm font-mono">{sa.groupId}</span>
            </div>
            {sa.fromPorts && sa.fromPorts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Ports:</span>
                {sa.fromPorts.map((port) => (
                  <Badge key={port} variant="outline" className="font-mono">
                    {port}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'aws_rds_db_instance':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{sa.endpointAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                Port: {sa.endpointPort}
              </Badge>
              <Badge variant="outline">{sa.metadata?.engine || 'Unknown DB'}</Badge>
            </div>
          </div>
        );

      case 'aws_ec2_instance':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{sa.publicDnsName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                IP: {sa.publicIpAddress}
              </Badge>
              {sa.metadata?.instance_type && (
                <Badge variant="outline">{sa.metadata.instance_type}</Badge>
              )}
            </div>
          </div>
        );

      case 'aws_route53_record':
      case 'aws_s3_bucket':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-mono">{sa.name}</span>
            {sa.metadata?.region && (
              <Badge variant="outline" className="w-fit">
                {sa.metadata.region}
              </Badge>
            )}
          </div>
        );

      case 'aws_api_gateway_rest_api':
      case 'aws_api_gateway_stage':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-mono">{sa.metadata?.name}</span>
            <div className="flex items-center gap-2">
              {sa.metadata?.api_id && (
                <Badge variant="outline" className="font-mono">
                  API ID: {sa.metadata.api_id}
                </Badge>
              )}
              {sa.metadata?.stage && (
                <Badge variant="outline" className="font-mono">
                  Stage: {sa.metadata.stage}
                </Badge>
              )}
            </div>
          </div>
        );

      default:
        return <span className="text-sm text-muted-foreground">No details available</span>;
    }
  };

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(data.current_page - 1) * data.current_limit + 1} to{' '}
          {Math.min(data.current_page * data.current_limit, data.total_count)} of {data.total_count}{' '}
          entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={data.current_page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(data.current_page - 1)}
            disabled={data.current_page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === data.current_page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(data.current_page + 1)}
            disabled={data.current_page === data.total_pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(data.total_pages)}
            disabled={data.current_page === data.total_pages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-lg font-medium text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Services</span>
                  <Badge variant="secondary" className="font-mono">
                    {selectedRows.length}
                  </Badge>
                </div>

                {selectedRows.length > 1 && (
                  <button
                    onClick={() => setSelectedRows([])}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <hr className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <div className="flex flex-wrap gap-2">
              {selectedRows.map((asset) => (
                <div
                  key={asset.uuid}
                  className="group flex items-center gap-1.5 bg-background text-sm px-3 py-1.5 rounded-full border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <span className="max-w-[200px] truncate">{asset.name || 'N/A'}</span>
                  <button
                    onClick={() => handleSelectRow(false, asset)}
                    className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    aria-label={`Remove ${asset.name || 'N/A'} from selection`}
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] p-0 ps-2">
                <div className="h-8 flex items-center justify-center">
                  <Checkbox
                    checked={areAllCurrentPageItemsSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all on current page"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[180px]">Service Type</TableHead>
              <TableHead className="min-w-[300px]">Details</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Status
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Added By
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((asset) => (
              <TableRow key={asset.uuid} className="group hover:bg-muted/50 transition-colors">
                <TableCell className="p-0 ps-2">
                  <div className="h-16 flex items-center justify-center">
                    <Checkbox
                      checked={selectedRows.some((row) => row.uuid === asset.uuid)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(checked as boolean, {
                          uuid: asset.uuid,
                          name: asset.name || getAssetName(asset),
                        })
                      }
                      aria-label={`Select ${asset.name || getAssetName(asset)}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getAssetIcon(asset.subType)}
                    <span className="text-sm font-medium">
                      {asset.subType
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getAssetDetails(asset)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      asset.active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {asset.active ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {asset.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {asset.addedBy ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{asset.addedBy.username}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              <span>{asset.addedBy.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {asset.addedBy.role}
                              </Badge>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm">System</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(asset.updatedAt), 'MMM d, yyyy')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(asset.updatedAt), 'MMM d, yyyy HH:mm:ss')}</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </div>
  );
}
