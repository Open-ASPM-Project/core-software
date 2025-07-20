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
import { Loader2, Package2, GitFork, X, Check } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddToNewGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRepos: { id: number; name: string }[];
  onReposChange: (repos: { id: number; name: string }[]) => void;
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

const AddToNewGroupDialog: React.FC<AddToNewGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedRepos,
  onReposChange,
  commonAPIRequest,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (selectedRepos.length === 0) {
      newErrors.name = 'At least one repository is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRemoveRepo = (repoId: number) => {
    const updatedRepos = selectedRepos.filter((repo) => repo.id !== repoId);
    onReposChange(updatedRepos);
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
          setIsSuccess(true);
        } else {
          setErrors({ name: 'Failed to create group. Please try again.' });
        }
      }
    );
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isSuccess ? 'sm:max-w-[400px]' : 'sm:max-w-[600px]'}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Group Created Successfully</h2>
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
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Create New Group
              </DialogTitle>
              <DialogDescription>
                Create a new group with {selectedRepos.length} selected repositories
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-0" />

            <div className="grid gap-6 pb-4">
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="resize-none"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-left">Selected Repositories</Label>
                  <Badge variant="secondary" className="font-mono">
                    {selectedRepos.length}
                  </Badge>
                </div>
                <div className="border rounded-lg bg-muted/40">
                  <div className="p-3 border-b bg-muted/60 rounded-t-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GitFork className="h-4 w-4" />
                      <span>Click × to remove repositories</span>
                    </div>
                  </div>
                  <ScrollArea className="h-[140px]">
                    <div className="p-3 flex flex-wrap gap-2">
                      {selectedRepos.map((repo) => (
                        <div
                          key={repo.id}
                          className="group flex items-center gap-1.5 bg-background hover:bg-muted text-sm px-3 py-1.5 rounded-full border hover:border-primary/30 transition-colors"
                        >
                          <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="max-w-[200px] truncate">{repo.name}</span>
                          <button
                            onClick={() => handleRemoveRepo(repo.id)}
                            className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            aria-label={`Remove ${repo.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {selectedRepos.length === 0 && (
                        <div className="flex items-center justify-center w-full h-[80px] text-sm text-muted-foreground">
                          No repositories selected
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            <Separator className="my-0" />

            <DialogFooter className="sm:justify-end pt-0">
              <Button type="button" variant="outline" onClick={handleClose} className="mr-2">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedRepos.length === 0}
                onClick={handleSubmit}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100"
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddToNewGroupDialog);
