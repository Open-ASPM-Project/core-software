import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface DeleteSSOConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  config: { name: string } | null;
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

const DeleteSSOConfigDialog: React.FC<DeleteSSOConfigDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  config,
  commonAPIRequest,
}) => {
  const handleDelete = async () => {
    if (!commonAPIRequest || !config) return;

    const endpoint = API_ENDPOINTS.sso.deleteConfig;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: `${apiUrl}/${config.name}`,
        method: 'DELETE',
      },
      (response) => {
        if (response) {
          onOpenChange(false);
          onSuccess();
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete SSO Configuration</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the SSO configuration for {config?.name}? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSSOConfigDialog;
