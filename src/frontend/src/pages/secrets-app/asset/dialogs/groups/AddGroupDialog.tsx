import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FolderPlus, Loader2 } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { SelectRepo } from '@/components/filter/SelectRepo';

interface AddGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

interface Repository {
  id: number;
  name: string;
  repoUrl?: string;
  author: string;
  secrets_count: number;
  lastScanDate: string;
}

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

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  commonAPIRequest,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    repos?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { name?: string; repos?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (selectedRepos.length === 0) {
      newErrors.repos = 'Please select at least one repository';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const endpoint = API_ENDPOINTS.group.addGroup;
    const apiUrl = createEndpointUrl(endpoint);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      repos: selectedRepos.map((repo) => repo.id),
    };

    commonAPIRequest<Group>(
      {
        api: apiUrl,
        method: endpoint.method,
        data: payload,
      },
      (response) => {
        setIsSubmitting(false);
        if (response) {
          onSuccess();
          handleClose();
        } else {
          setErrors({ name: 'Failed to create group. Please try again.' });
        }
      }
    );
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setSelectedRepos([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 
        dark:from-violet-600/20 dark:to-blue-600/20 
        border-b border-violet-100 dark:border-violet-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <FolderPlus className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>Add a new group to organize your repositories.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-left">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-left">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter group description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-left">Repositories</Label>
              <SelectRepo
                selectedValues={selectedRepos}
                onSelectedChange={(repos) => {
                  setSelectedRepos(repos);
                  setErrors((prev) => ({ ...prev, repos: undefined }));
                }}
                placeholder="Select repositories..."
                error={errors.repos}
                commonAPIRequest={commonAPIRequest}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddGroupDialog);
