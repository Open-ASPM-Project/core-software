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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  SearchX,
  ListOrderedIcon,
  AlignLeftIcon,
  GitForkIcon,
  CalendarIcon,
  FolderIcon,
  ChevronRightIcon,
  PenSquareIcon,
  Trash2Icon,
  MoreVerticalIcon,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAMPM } from '@/utils/commonFunctions';
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu';
import EditGroupDialog from '@/pages/secrets-app/asset/dialogs/groups/EditGroupDialog';
import DeleteGroupDialog from '@/pages/secrets-app/asset/dialogs/groups/DeleteGroupDialog';
import ViewRepositoriesForGroupDialog from '@/pages/secrets-app/asset/dialogs/groups/ViewRepositoriesForGroupDialog';

interface Group {
  id: number;
  name: string;
  description: string;
  active: boolean;
  repo_count: number;
  created_on: string;
  created_by: number;
  updated_by: number;
  score_normalized: number;
  score_normalized_on: string;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  order_by?: 'asc' | 'desc';
  sort_by?: 'repo_count' | 'created_at' | 'score';
}

const ScaGroupTable = ({
  groups,
  isLoading,
  limit,
  handleOrderChange,
  handleSortByChange,
  onSuccess,
}: {
  isLoading: boolean;
  groups: Group[];
  limit: number;
  handleOrderChange: () => void;
  handleSortByChange: (field: QueryParams['sort_by']) => void;
  onSuccess: () => void;
}) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    group: { id: number; name: string } | null;
  }>({
    isOpen: false,
    group: null,
  });

  const [editDialog, setEditDialog] = React.useState<{
    isOpen: boolean;
    group: { id: number; name: string; description: string } | null;
  }>({
    isOpen: false,
    group: null,
  });

  const [reposDialogOpen, setReposDialogOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(null);

  const handleEditClick = (group: { id: number; name: string; description: string }) => {
    setEditDialog({
      isOpen: true,
      group,
    });
  };

  const handleDeleteClick = (group: { id: number; name: string }) => {
    setDeleteDialog({
      isOpen: true,
      group,
    });
  };

  // In your onClick handler:
  const handleViewRepos = (groupId: number) => {
    setSelectedGroupId(groupId);
    setReposDialogOpen(true);
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
            <div className="flex-1 flex items-center gap-2">
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="w-[200px] flex justify-start">
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <div className="w-[100px] flex justify-start">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[100px] flex justify-start">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-[150px] flex justify-start">
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <div className="w-[50px] flex justify-center">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </TableCell>
    </TableRow>
  );

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-96">
        <div className="flex flex-col items-center justify-center h-full">
          <SearchX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No groups found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search criteria
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-auto custom-scrollbar">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950">
            <TableHead>
              <Button
                onClick={() => handleOrderChange()}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <ListOrderedIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Name
                <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <AlignLeftIcon className="h-4 w-4 text-muted-foreground" />
                Description
              </div>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('repo_count')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <GitForkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Repositories
                <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('score')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                Score
                <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                onClick={() => handleSortByChange('created_at')}
                variant="ghost"
                className="h-8 w-full justify-start font-bold text-primary hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Created On
                <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : groups.length === 0 ? (
            <EmptyState />
          ) : (
            groups?.map((group) => (
              <TableRow key={group.id} className="group hover:bg-muted/50 ">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                      <FolderIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-primary/90 group-hover:text-primary transition-colors">
                      {group.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="max-w-[300px]">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {group.description || 'No description provided'}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewRepos(group?.id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group/btn"
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-500/10 p-1.5 group-hover/btn:bg-blue-500/20 transition-colors">
                        <GitForkIcon className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium min-w-[20px]">{group.repo_count} Repos</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
                  </Button>
                </TableCell>

                <TableCell>
                  {(() => {
                    const score = Math.ceil(group.score_normalized);
                    const { className, label } = getScoreBadgeStyle(score);
                    return (
                      <Badge
                        variant="outline"
                        className={`${className} px-3 py-1 font-medium  items-center gap-2`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{label}</span>
                          {/* <span className="text-xs opacity-90">Score: {100 - score}</span> */}
                        </div>
                      </Badge>
                    );
                  })()}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(group.created_on).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatAMPM(new Date(group.created_on))}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {/* <DropdownMenuItem className="flex items-center gap-2 focus:bg-purple-500/10 cursor-pointer">
                        <div className="rounded-md bg-purple-500/10 p-1">
                          <EyeIcon className="h-4 w-4 text-purple-500" />
                        </div>
                        <span>View Details</span>
                      </DropdownMenuItem> */}

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditClick(group);
                        }}
                        className="flex items-center gap-2 focus:bg-blue-500/10 cursor-pointer"
                      >
                        <div className="rounded-md bg-blue-500/10 p-1">
                          <PenSquareIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <span>Edit Group</span>
                      </DropdownMenuItem>

                      {/* <DropdownMenuItem className="flex items-center gap-2 focus:bg-green-500/10 cursor-pointer">
                        <div className="rounded-md bg-green-500/10 p-1">
                          <FolderPlusIcon className="h-4 w-4 text-green-500" />
                        </div>
                        <span>Add Repositories</span>
                      </DropdownMenuItem> */}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(group);
                        }}
                        className="flex items-center gap-2 focus:bg-red-500/10 cursor-pointer text-red-500 focus:text-red-500"
                      >
                        <div className="rounded-md bg-red-500/10 p-1">
                          <Trash2Icon className="h-4 w-4" />
                        </div>
                        <span>Delete Group</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editDialog.group && (
        <EditGroupDialog
          isOpen={editDialog.isOpen}
          onClose={() => setEditDialog({ isOpen: false, group: null })}
          onSuccess={onSuccess}
          group={editDialog.group}
        />
      )}

      {deleteDialog.group && (
        <DeleteGroupDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, group: null })}
          onSuccess={onSuccess}
          group={deleteDialog.group}
        />
      )}

      {selectedGroupId && (
        <ViewRepositoriesForGroupDialog
          open={reposDialogOpen}
          onOpenChange={setReposDialogOpen}
          groupId={selectedGroupId}
        />
      )}
    </div>
  );
};

// Utility functions
const getScoreBadgeStyle = (score: number) => {
  if (score >= 81) {
    return {
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400  items-center',
      label: 'Critical',
    };
  }
  if (score >= 61) {
    return {
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400  items-center',
      label: 'Poor',
    };
  }
  if (score >= 41) {
    return {
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400  items-center',
      label: 'Fair',
    };
  }
  if (score >= 21) {
    return {
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400  items-center',
      label: 'Good',
    };
  }
  return {
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400  items-center',
    label: 'Excellent',
  };
};

export default ScaGroupTable;
