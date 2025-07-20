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
  Globe,
  MoreHorizontal,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Network,
  Server,
  Globe2,
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
}

export interface DomainAsset {
  uuid: string;
  active: boolean;
  type: string;
  name: string | null;
  url: string;
}

export interface SubdomainAsset {
  uuid: string;
  active: boolean;
  type: string;
  name: string | null;
  url: string;
  domainAsset: DomainAsset | null;
}

export interface IPAsset {
  uuid: string;
  active: boolean;
  type: string;
  name: string | null;
  ipAddress: string;
  ipType: string;
}

export interface WebappAsset {
  uuid: string;
  active: boolean;
  type: string;
  name: string | null;
  url: string;
  port: number;
  createdAt: string;
  updatedAt: string;
  addedBy: User | null;
  updatedBy: User | null;
  domainAsset: DomainAsset | null;
  subdomainAsset: SubdomainAsset | null;
  ipAsset: IPAsset | null;
}

export interface PaginatedResponse {
  current_page: number;
  current_limit: number;
  total_count: number;
  total_pages: number;
  data: WebappAsset[];
}

interface VMWebappAssetTableProps {
  data: PaginatedResponse;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function VMWebappAssetTable({
  data,
  onPageChange,
  isLoading = false,
}: VMWebappAssetTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<{ uuid: string; name: string | null }[]>(
    []
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageAssets =
        data.data?.map((asset) => ({
          uuid: asset.uuid,
          name: asset.name,
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
      setSelectedRows((prev) => [
        ...prev,
        {
          uuid: asset.uuid,
          name: asset.name,
        },
      ]);
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

  const truncateString = (str: string | null, maxLength: number) => {
    if (!str) return 'N/A';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  };

  const getPortBadge = (port: number) => (
    <Badge variant="outline" className="text-xs font-mono">
      Port {port}
    </Badge>
  );

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  function getAssetInfo(asset: WebappAsset) {
    if (asset.ipAsset && asset.ipAsset.ipAddress && asset.ipAsset.ipType) {
      return (
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-orange-500" />
          <span className="truncate max-w-[200px] font-medium" title={asset.ipAsset.ipAddress}>
            {asset.ipAsset.ipAddress}
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {asset.ipAsset.ipType}
          </Badge>
          {asset.port > 0 && getPortBadge(asset.port)}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => openInNewTab(asset.ipAsset.ipAddress)}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      );
    }

    if (asset.subdomainAsset && asset.subdomainAsset.url) {
      return (
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-green-500" />
          <span className="truncate max-w-[200px] font-medium" title={asset.subdomainAsset.url}>
            {asset.subdomainAsset.url}
          </span>
          {asset.port > 0 && getPortBadge(asset.port)}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => openInNewTab(asset.subdomainAsset.url)}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      );
    }

    if (asset.domainAsset && asset.domainAsset.url) {
      return (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <span className="truncate max-w-[200px] font-medium" title={asset.domainAsset.url}>
            {asset.domainAsset.url}
          </span>
          {asset.port > 0 && getPortBadge(asset.port)}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted"
            onClick={() => openInNewTab(asset.domainAsset.url)}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-purple-500" />
        <span className="truncate max-w-[200px] font-medium" title={asset.url}>
          {asset.url}
        </span>
        {asset.port > 0 && getPortBadge(asset.port)}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-muted"
          onClick={() => openInNewTab(asset.url)}
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

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
                  <span className="text-sm font-medium">Selected Assets</span>
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
                  <Server className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[200px] truncate">{asset.name || 'N/A'}</span>
                  <button
                    onClick={() => handleSelectRow(false, { uuid: asset.uuid, name: asset.name })}
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
              <TableHead className="w-[300px]">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Name
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Asset Info
                </div>
              </TableHead>
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
                          name: asset.name,
                        })
                      }
                      aria-label={`Select ${asset.name || 'N/A'}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate" title={asset.name || 'N/A'}>
                        {truncateString(asset.name, 32)}
                      </span>
                    </div>
                    <button
                      onClick={() => openInNewTab(asset.url)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate text-left w-fit"
                      title={asset.url}
                    >
                      {truncateString(asset.url, 32)}
                    </button>
                  </div>
                </TableCell>
                <TableCell>{getAssetInfo(asset)}</TableCell>
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
                          <div className="flex items-center gap-2">
                            <span>{asset.addedBy.userEmail}</span>
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
