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

interface DeleteVCSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vcs: {
    id: number;
    name: string;
    type: string;
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

const DeleteVCSDialog: React.FC<DeleteVCSDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vcs,
  commonAPIRequest,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const endpoint = API_ENDPOINTS.vcs.deleteVcs;
    const apiUrl = createEndpointUrl(endpoint, { id: vcs.id });

    commonAPIRequest(
      {
        api: apiUrl + vcs?.id,
        method: endpoint.method,
      },
      (response) => {
        setIsDeleting(false);
        if (response) {
          setIsDeleted(true);
        } else {
          setError('Failed to delete VCS integration. Please try again.');
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

  const getVCSTypeLabel = () => {
    const labels = {
      github: 'GitHub',
      gitlab: 'GitLab',
      bitbucket: 'Bitbucket',
    };
    return labels[vcs.type as keyof typeof labels] || vcs.type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        {!isDeleted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex text-lg items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Delete VCS Integration
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the {getVCSTypeLabel()} integration{' '}
                <span className="font-medium text-foreground">"{vcs.name}"</span>? This action will
                remove all associated repositories and cannot be undone.
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
                  <>Delete Integration</>
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
              <h2 className="text-xl font-semibold tracking-tight">
                Integration Deleted Successfully
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                The {getVCSTypeLabel()} integration "{vcs.name}" has been deleted
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

export default withAPIRequest(DeleteVCSDialog);
