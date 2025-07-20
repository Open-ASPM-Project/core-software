import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: number;
    username: string;
    role: string;
  };
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

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  commonAPIRequest,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const endpoint = API_ENDPOINTS.users.deleteUser;
    const apiUrl = createEndpointUrl(endpoint, { id: user.id });

    commonAPIRequest(
      {
        api: `${apiUrl}${user?.id}`,
        method: endpoint.method,
      },
      (response) => {
        setIsDeleting(false);
        if (response) {
          setIsDeleted(true);
        } else {
          setError('Failed to delete user. Please try again.');
        }
      }
    );
  };

  const handleClose = () => {
    if (isDeleted) {
      onSuccess();
    }
    onClose();
    // Reset states after animation completes
    setTimeout(() => {
      setIsDeleted(false);
      setError(null);
    }, 150);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        {!isDeleted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex text-lg items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete user{' '}
                <span className="font-medium text-foreground">"{user.username}"</span>
                {user.role === 'admin' && (
                  <span className="block mt-1 text-red-500">
                    Warning: This is an administrator account.
                  </span>
                )}
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>Delete User</>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">User Deleted Successfully</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The user "{user.username}" has been deleted
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(DeleteUserDialog);
