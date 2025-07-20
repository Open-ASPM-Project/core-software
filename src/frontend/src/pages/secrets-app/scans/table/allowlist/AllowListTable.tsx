import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreVertical,
  ArrowUpDown,
  CircleDot,
  FolderGit2,
  AlignJustify,
  Github,
  GitBranch,
  FolderX,
  Globe,
  MessageCircle,
  Pencil,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EditAllowListDialog from '../../dialogs/allowlist/EditAllowListDialog';
import { formatAMPM } from '@/utils/commonFunctions';
import AllowListCommentsDialog from '../../dialogs/allowlist/AllowListCommentsDialog';

interface VCS {
  id: number;
  name: string;
}

interface Repo {
  id: number;
  name: string;
}

interface AllowList {
  id: number;
  type: string;
  name: string;
  active: boolean;
  global_: boolean;
  created_on: string;
  vcs: VCS[];
  repos: Repo[];
}

const VCIcon = ({ type }: { type: string }) => {
  switch (type?.toLowerCase()) {
    case 'github':
      return <Github className="w-4 h-4" />;
    case 'gitlab':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
        </svg>
      );
    default:
      return <GitBranch className="w-4 h-4" />;
  }
};

const AllowListTable = ({
  isLoading,
  allowList,
  limit,
  handleSortByChange,
  fetchAllowLists,
}: {
  isLoading: boolean;
  allowList: AllowList[];
  limit: number;
  fetchAllowLists: () => void;
  handleSortByChange: (field: 'name' | 'type' | 'created_on' | 'active') => void;
}) => {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedAllowList, setSelectedAllowList] = React.useState<AllowList | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = React.useState(false);
  const [selectedComments, setSelectedComments] = React.useState<{
    comments: any[];
    name: string;
  } | null>(null);

  const handleEditClick = (allowList: AllowList) => {
    setSelectedAllowList(allowList);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh your data or handle success
    fetchAllowLists(); // Example refresh function
  };

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
            <div className="w-[200px]">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="w-[100px]">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="w-[200px]">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="w-[50px]">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </TableCell>
    </TableRow>
  );

  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16">
          {/* Icon Container with Gradient */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/5 dark:to-blue-500/5 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 p-6 rounded-full">
              <div className="relative flex items-center justify-center">
                <AlignJustify className="w-12 h-12 text-emerald-600/90 dark:text-emerald-400/90" />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
            No Allow List Rules Found
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            You haven't created any allow list rules yet. Allow lists help you manage exceptions for
            your security scans.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="rounded-md border dark:border-gray-700 custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                onClick={() => handleSortByChange('name')}
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                onClick={() => handleSortByChange('type')}
              >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                onClick={() => handleSortByChange('active')}
              >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
              >
                VCS
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
              >
                Repositories
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start font-bold hover:text-emerald-600 dark:hover:text-emerald-400 text-primary"
                onClick={() => handleSortByChange('created_on')}
              >
                Created On
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : allowList.length === 0 ? (
            <EmptyState />
          ) : (
            allowList?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlignJustify className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="truncate max-w-[32ch]">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.type === 'SECRET' ? 'destructive' : 'default'}>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.active ? 'success' : 'secondary'}>
                    <CircleDot className="w-3 h-3 mr-1" />
                    {item.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.vcs.length > 0 && (
                      <div className="flex items-center">
                        {/* Primary VC Display */}
                        <div className="flex items-center bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border border-slate-200/50 dark:border-slate-700/50 p-1.5 rounded-lg shadow-sm">
                          <div className="p-1 rounded-md bg-white/50 dark:bg-slate-900/50">
                            <VCIcon
                              type={item.vcs[0].type || 'github'}
                              className="w-4 h-4 text-blue-600 dark:text-blue-400"
                            />
                          </div>
                          <span className="ml-2 font-medium text-slate-700 dark:text-slate-200">
                            {item.vcs[0].name}
                          </span>
                        </div>

                        {/* Additional VCs Badge with Tooltip */}
                        {item.vcs.length > 1 && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="ml-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 
                             text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50
                             cursor-pointer transition-all duration-200 shadow-sm hover:shadow
                             px-2.5 py-1 text-xs font-medium"
                                  >
                                    +{item.vcs.length - 1} more
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="p-3 w-[220px] bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800"
                                align="start"
                              >
                                <div className="space-y-2">
                                  {/* Tooltip Header */}
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
                                    Other Version Controls
                                  </div>

                                  {/* Additional VCs List */}
                                  {item.vcs.slice(1).map((vc) => (
                                    <div
                                      key={vc.id}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-md
                               hover:bg-slate-50 dark:hover:bg-slate-800/50
                               transition-colors duration-200"
                                    >
                                      <div
                                        className="p-1.5 rounded-md bg-gradient-to-r from-slate-50 to-blue-50 
                                    dark:from-slate-800 dark:to-blue-900/20
                                    border border-slate-200/50 dark:border-slate-700/50"
                                      >
                                        <VCIcon
                                          type={vc.type || 'github'}
                                          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                          {vc.name}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                          {vc.type || 'github'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.global_ ? (
                    // Global enabled - show all repositories indicator
                    <div className="flex items-center gap-2">
                      <div
                        className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                    border border-purple-100/50 dark:border-purple-700/50 
                    px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-white/50 dark:bg-slate-900/50">
                            <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            All Repositories
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : item.repos.length > 0 ? (
                    // Specific repositories selected
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div
                          className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 
                      border border-indigo-100/50 dark:border-indigo-700/50
                      p-1.5 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-md bg-white/50 dark:bg-slate-900/50">
                              <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {item.repos[0].name}
                            </span>
                          </div>
                        </div>

                        {item.repos.length > 1 && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="ml-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 
                             text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50
                             cursor-pointer transition-all duration-200 shadow-sm hover:shadow
                             px-2.5 py-1 text-xs font-medium"
                                  >
                                    +{item.repos.length - 1} more
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="p-3 w-[250px] bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800"
                                align="start"
                              >
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
                                    Other Repositories
                                  </div>
                                  {item.repos.slice(1).map((repo) => (
                                    <div
                                      key={repo.id}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-md
                               hover:bg-slate-50 dark:hover:bg-slate-800/50
                               transition-colors duration-200"
                                    >
                                      <div
                                        className="p-1.5 rounded-md bg-gradient-to-r from-slate-50 to-blue-50 
                                    dark:from-slate-800 dark:to-blue-900/20
                                    border border-slate-200/50 dark:border-slate-700/50"
                                      >
                                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                      </div>
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {repo.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ) : (
                    // No repositories selected
                    <div className="flex items-center gap-2">
                      <div
                        className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 
                    border border-slate-200/50 dark:border-slate-700/50
                    px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-white/50 dark:bg-slate-900/50">
                            <FolderX className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No repositories
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md">
                      <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(item.created_on).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatAMPM(new Date(item.created_on))}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] p-1">
                      {/* <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                        <Eye className="w-4 h-4 mr-2 text-blue-500" />
                        <span>View Details</span>
                      </DropdownMenuItem> */}

                      <DropdownMenuItem
                        className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={() => {
                          setSelectedComments({ comments: item.comments, name: item.name });
                          setCommentsDialogOpen(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-indigo-500" />
                        <span>View Comments</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => handleEditClick(item)}
                        className="flex items-center px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2 text-emerald-500" />
                        <span>Edit Details</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1 bg-slate-200 dark:bg-slate-700" />

                      {/* <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-red-600 dark:text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {selectedAllowList && (
        <EditAllowListDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          allowList={selectedAllowList}
          onSuccess={handleEditSuccess}
        />
      )}

      {selectedComments && (
        <AllowListCommentsDialog
          open={commentsDialogOpen}
          onOpenChange={setCommentsDialogOpen}
          comments={selectedComments.comments}
          allowListName={selectedComments.name}
        />
      )}
    </div>
  );
};

export default AllowListTable;
