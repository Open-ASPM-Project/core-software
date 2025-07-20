import React, { useState, useEffect } from 'react';
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
import { Loader2, PenSquare, Check } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { SelectRepo } from '@/components/filter/SelectRepo';

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: {
    id: number;
    name: string;
    description: string;
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
  repos: Repository[];
}

const EditGroupDialog: React.FC<EditGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  group,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
  });
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [errors, setErrors] = useState<{
    name?: string;
    repos?: string;
    fetch?: string;
  }>({});

  // Fetch group details including repositories
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setErrors({});

      const endpoint = API_ENDPOINTS.group.getGroupDetails;
      const apiUrl = createEndpointUrl(endpoint, { id: group.id });

      commonAPIRequest<Group>(
        {
          api: apiUrl + group?.id,
          method: endpoint.method,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setFormData({
              name: response.name,
              description: response.description || '',
            });
            setSelectedRepos(response.repos || []);
          } else {
            setErrors({ fetch: 'Failed to load group details. Please try again.' });
          }
        }
      );
    }
  }, [isOpen, group.id, commonAPIRequest]);

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

    const endpoint = API_ENDPOINTS.group.updateGroup;
    const apiUrl = createEndpointUrl(endpoint, { id: group.id });

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      repos: selectedRepos.map((repo) => repo.id),
    };

    commonAPIRequest<Group>(
      {
        api: apiUrl + group?.id,
        method: endpoint.method,
        data: payload,
      },
      (response) => {
        setIsSubmitting(false);
        if (response) {
          setIsUpdated(true);
          // Removed the auto-close setTimeout
        } else {
          setErrors({ name: 'Failed to update group. Please try again.' });
        }
      }
    );
  };

  const handleClose = () => {
    onClose();
    if (isUpdated) {
      onSuccess();
    }
    // Reset states after animation completes
    setTimeout(() => {
      setIsUpdated(false);
      setErrors({});
    }, 150);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isUpdated ? 'sm:max-w-[400px]' : 'sm:max-w-[600px] p-0 gap-0'}>
        {isUpdated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Group Updated Successfully</h2>
            <p className="text-sm text-muted-foreground mt-1">All changes have been saved</p>

            <Button
              className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 gap-2 min-w-[200px]"
              onClick={() => {
                onSuccess();
                handleClose();
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader
              className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 
    dark:from-violet-600/20 dark:to-blue-600/20 
    border-b border-violet-100 dark:border-violet-800/30"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <PenSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <DialogTitle>Update Group</DialogTitle>
                  <DialogDescription>
                    Modify group details and manage repositories.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 p-6">
                  {errors.fetch ? (
                    <div className="text-sm text-red-500 bg-destructive/10 rounded-md p-3">
                      {errors.fetch}
                    </div>
                  ) : (
                    <>
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
                        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description" className="text-left">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Enter group description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
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
                    </>
                  )}
                </div>

                <DialogFooter className="sm:justify-end pb-2 p-6 pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="mr-2"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg "
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EditGroupDialog);
