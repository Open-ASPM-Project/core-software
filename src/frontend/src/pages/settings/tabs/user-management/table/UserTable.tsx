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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Shield,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  KeyRound,
} from 'lucide-react';
import EditUserDialog from '../dialogs/EditUserDialog';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAMPM } from '@/utils/commonFunctions';
import DeleteUserDialog from '../dialogs/DeleteUserDialog';
import AdminResetPasswordDialog from '../dialogs/AdminResetPasswordDialog';

export interface User {
  username: string;
  user_email: string;
  role: 'admin' | 'user' | 'readonly';
  active: boolean;
  id: number;
  created_at: string;
  updated_at: string;
  group_id: number;
  added_by_uid: number;
  updated_by_uid: number;
}

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onSuccess: () => void; // Single callback for both edit and delete
}

const getRoleBadgeConfig = (role: 'admin' | 'user' | 'readonly') => {
  switch (role) {
    case 'admin':
      return 'bg-green-500/15 text-green-700 dark:text-green-400';
    case 'user':
      return 'bg-red-500/15 text-red-700 dark:text-red-400';
    case 'readonly':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400';
  }
};

const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    user: 'Security Analyst',
    readonly: 'Developer',
  };
  return roleMap[role] || role;
};

const getStatusConfig = (active: boolean) => {
  return active
    ? {
        icon: CheckCircle2,
        text: 'Active',
        className: 'bg-green-500/15 text-green-700 dark:text-green-400',
      }
    : {
        icon: XCircle,
        text: 'Inactive',
        className: 'bg-red-500/15 text-red-700 dark:text-red-400',
      };
};

const getAvatarFallbackColor = (username: string) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  const index = username.length % colors.length;
  return colors[index];
};

const LoadingSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[120px]" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-[100px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-[80px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-[100px]" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-md" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

const UserTable: React.FC<UserTableProps> = ({ users, isLoading, onSuccess }) => {
  const [editDialog, setEditDialog] = React.useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });

  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    user: { id: number; username: string; role: string } | null;
  }>({
    isOpen: false,
    user: null,
  });

  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const handleEditClick = (user: User) => {
    setEditDialog({
      isOpen: true,
      user,
    });
  };

  const handleDeleteClick = (user: { id: number; username: string; role: string }) => {
    setDeleteDialog({
      isOpen: true,
      user,
    });
  };

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950">
            <TableHead className="text-primary">Username</TableHead>
            <TableHead className="text-primary">Role</TableHead>
            <TableHead className="text-primary">Status</TableHead>
            <TableHead className="text-primary">Created At</TableHead>
            <TableHead className="w-[80px] text-shite">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            users.map((user) => {
              const statusConfig = getStatusConfig(user.active);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={`${getAvatarFallbackColor(user.username)} text-white`}
                        >
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-muted-foreground">{user.user_email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge variant="secondary" className={getRoleBadgeConfig(user.role)}>
                        {getRoleName(user.role)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusConfig.className}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusConfig.text}</span>
                      </div>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {new Date(user.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatAMPM(new Date(user.created_at))}
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell> */}

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(user);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                          Edit User
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResetPasswordClick(user);
                          }}
                        >
                          <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
                          Reset Password
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick({
                              id: user.id,
                              username: user.username,
                              role: user.role,
                            });
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Edit Dialog */}
                    {editDialog.user && (
                      <EditUserDialog
                        isOpen={editDialog.isOpen}
                        onClose={() => setEditDialog({ isOpen: false, user: null })}
                        onSuccess={onSuccess}
                        user={editDialog.user}
                      />
                    )}

                    {/* Delete Dialog */}
                    {deleteDialog.user && (
                      <DeleteUserDialog
                        isOpen={deleteDialog.isOpen}
                        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
                        onSuccess={onSuccess}
                        user={deleteDialog.user}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {selectedUser && (
        <AdminResetPasswordDialog
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserTable;
