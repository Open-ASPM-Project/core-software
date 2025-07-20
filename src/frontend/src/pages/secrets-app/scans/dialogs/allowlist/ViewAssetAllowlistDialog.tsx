import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Shield,
  Calendar,
  GitFork,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  SearchX,
  User,
  Lock,
  Globe,
  Clock,
  FileText,
  Plus,
} from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import AddAssetsAllowListDialog from './AddAssetsAllowListDialog';

interface AssetAllowlist {
  id: number;
  type: string;
  name: string | null;
  active: boolean;
  global_: boolean;
  created_on: string;
  repos: {
    id: number;
    name: string;
  }[];
  comments: {
    comment: string;
    id: number;
    created_by: string;
    user_id: number;
    created_on: string;
  }[];
}

interface ViewAssetAllowlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const ViewAssetAllowlistDialog: React.FC<ViewAssetAllowlistDialogProps> = ({
  open,
  onOpenChange,
  commonAPIRequest,
}) => {
  const [assets, setAssets] = React.useState<AssetAllowlist[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assetAllowlistDialogOpen, setAssetAllowlistDialogOpen] = React.useState(false);

  const fetchAssets = React.useCallback(() => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.allowList.getAllowList;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        params: {
          repo_whitelist: true,
        },
      },
      (response: { data: AssetAllowlist[] } | null) => {
        setLoading(false);
        if (response) {
          setAssets(response.data);
        }
      }
    );
  }, [commonAPIRequest]);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      fetchAssets();
    }
  }, [open, fetchAssets]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-600/20 dark:to-blue-600/20 border-b">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <DialogTitle>Asset Allowlists</DialogTitle>
                <DialogDescription>
                  View all asset allowlists and their configurations
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => setAssetAllowlistDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Asset Allowlist
              </Button>
              <Badge variant="outline" className="h-7">
                Total: {assets.length}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[600px] p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <SearchX className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No assets found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  No asset allowlists have been created yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="p-6 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50"
                  >
                    <div className="space-y-4">
                      {/* Header Section */}
                      <div className="flex items-start justify-between border-b pb-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`${
                                asset.active
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {asset.active ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {asset.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Created {format(new Date(asset.created_on), 'PP')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(asset.created_on), 'p')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Repository Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <GitFork className="w-4 h-4 text-blue-500" />
                          Repositories
                          <Badge variant="outline" className="ml-2">
                            {asset.repos.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                          {asset.repos.map((repo) => (
                            <div
                              key={repo.id}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate">{repo.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comments Section */}
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="comments">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-violet-500" />
                              <span>Comments</span>
                              <Badge variant="outline" className="ml-2">
                                {asset.comments.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {asset.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-muted p-3 rounded-lg text-sm flex items-start gap-3 hover:bg-muted/70 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium">{comment.created_by}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(new Date(comment.created_on), 'PPp')}
                                      </div>
                                    </div>
                                    <p className="text-muted-foreground">{comment.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <AddAssetsAllowListDialog
        open={assetAllowlistDialogOpen}
        onOpenChange={setAssetAllowlistDialogOpen}
        commonAPIRequest={commonAPIRequest}
        onSuccess={() => {
          fetchAssets();
        }}
      />
    </>
  );
};

export default withAPIRequest(ViewAssetAllowlistDialog);
