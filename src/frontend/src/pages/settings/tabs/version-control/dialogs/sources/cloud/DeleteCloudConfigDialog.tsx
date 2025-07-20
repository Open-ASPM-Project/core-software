import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { CloudConfig } from '../../../types/cloud';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface DeleteCloudConfigDialogProps {
  config: CloudConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  commonAPIRequest: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const DeleteCloudConfigDialog = ({
  config,
  open,
  onOpenChange,
  onSuccess,
  commonAPIRequest,
}: DeleteCloudConfigDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    const endpoint = API_ENDPOINTS.sources.deleteCloudSources;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<{ success: boolean }>(
      {
        api: `${apiUrl}/${config.uuid}`,
        method: endpoint.method,
      },
      (response) => {
        setIsDeleting(false);
        if (response !== null) {
          onSuccess?.();
          onOpenChange(false);
        }
      }
    );
  };

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-red-600 dark:text-red-400">
              Delete {getProviderName(config.cloudType)} Configuration
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center pt-2 text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this cloud configuration? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel className="border-gray-300 dark:border-gray-600" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default withAPIRequest(DeleteCloudConfigDialog);
