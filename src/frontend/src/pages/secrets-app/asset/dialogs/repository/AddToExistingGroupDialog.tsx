import React, { useState, useCallback, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, Package2, GitFork, X, Search, FolderEdit } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';

interface AddToExistingGroupDialogProps {
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
  score_normalized: number;
}

interface PaginatedResponse {
  items: Group[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
}

const AddToExistingGroupDialog: React.FC<AddToExistingGroupDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedRepos,
  onReposChange,
  commonAPIRequest,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchGroups = useCallback(
    (params: QueryParams) => {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.group.getGroups;
      const apiUrl = createEndpointUrl(endpoint);

      const queryParts: string[] = [`page=${params.page}`, `limit=${params.limit}`];
      if (params.search) queryParts.push(`search=${params.search}`);

      const finalUrl = `${apiUrl}?${queryParts.join('&')}`;

      commonAPIRequest<PaginatedResponse>(
        {
          api: finalUrl,
          method: endpoint.method,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setGroups(response);
          }
        }
      );
    },
    [commonAPIRequest]
  );

  useEffect(() => {
    if (isOpen) {
      fetchGroups({ page: 1, limit: 10, search: searchQuery });
    }
  }, [isOpen, searchQuery, fetchGroups]);

  const handleRemoveRepo = (repoId: number) => {
    const updatedRepos = selectedRepos.filter((repo) => repo.id !== repoId);
    onReposChange(updatedRepos);
  };

  const handleSubmit = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    const endpoint = API_ENDPOINTS.group.updateGroup;
    const apiUrl = createEndpointUrl(endpoint);

    const payload = {
      repo_ids: selectedRepos.map((repo) => repo.id),
    };

    commonAPIRequest<Group>(
      {
        api: apiUrl + selectedGroup.id + '/add_repos',
        method: endpoint.method,
        data: payload,
      },
      (response) => {
        setIsSubmitting(false);
        if (response) {
          setIsSuccess(true);
        }
      }
    );
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setSearchQuery('');
    setIsSuccess(false);
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
            <h2 className="text-xl font-semibold tracking-tight">
              Repositories Added Successfully
            </h2>
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
                <FolderEdit className="h-5 w-5" />
                Add to Existing Group
              </DialogTitle>
              <DialogDescription>
                Add {selectedRepos.length} repositories to an existing group
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-0" />

            <div className="grid gap-6 pb-4">
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

              <div className="grid gap-2">
                <Label className="text-left">Select Group</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-lg">
                  <ScrollArea className="h-[200px]">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="p-1">
                        {groups?.data?.map((group) => (
                          <div
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                              selectedGroup?.id === group.id ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Package2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group.repo_count} repositories
                                </p>
                              </div>
                            </div>
                            {selectedGroup?.id === group.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                disabled={isSubmitting || !selectedGroup || selectedRepos.length === 0}
                onClick={handleSubmit}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add to Group'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddToExistingGroupDialog);
