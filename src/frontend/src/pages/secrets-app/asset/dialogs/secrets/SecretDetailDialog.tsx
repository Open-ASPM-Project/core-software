import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import {
  KeyRound,
  AlertCircle,
  Code,
  GitCommit,
  User,
  Mail,
  Calendar,
  FileCode,
  Hash,
  GitFork,
  Link2,
  Shield,
  ArrowUpRightFromSquare,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface SecretDetail {
  secret: string;
  description: string;
  file: string;
  line: string;
  start_line: number;
  end_line: number;
  start_column: number;
  end_column: number;
  match: string;
  rule: string;
  commit: string;
  author: string;
  email: string;
  date: string;
  tags: string[];
  repository_id: number;
  message: string;
  fingerprint: string;
  entropy: number;
  severity: string;
  scan_type: string;
  whitelisted: boolean;
  id: number;
  whitelist_id: null;
  created_at: string;
  updated_at: string;
  repository: {
    id: number;
    name: string;
    repoUrl: string;
    author: string;
    lastScanDate: string;
  };
}

interface SecretDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretId: number;
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

// Loading component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-sm text-muted-foreground">Loading secret details...</p>
  </div>
);

// Error component
const ErrorState = ({ error }: { error: string }) => (
  <Alert variant="destructive" className="m-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

const SecretDetailDialog: React.FC<SecretDetailDialogProps> = ({
  open,
  onOpenChange,
  secretId,
  commonAPIRequest,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [secretDetail, setSecretDetail] = React.useState<SecretDetail | null>(null);

  console.log('secretId', secretId);

  const fetchSecretDetails = React.useCallback(() => {
    if (!secretId) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.secrets.getSecretDetails;
    const api = createEndpointUrl(endpoint);

    commonAPIRequest<SecretDetail>(
      {
        api: api + secretId,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setSecretDetail(response);
        } else {
          setError('Failed to fetch secret details');
        }
      }
    );
  }, [secretId, commonAPIRequest]);

  // Fetch details when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchSecretDetails();
    } else {
      // Reset states when dialog closes
      setSecretDetail(null);
      setError(null);
    }
  }, [open, fetchSecretDetails]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
              <KeyRound className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Secret Details</DialogTitle>
              {secretDetail && (
                <p className="text-sm text-muted-foreground mt-1">{secretDetail.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} />
          ) : secretDetail ? (
            <div className="p-6 space-y-6">
              {/* Secret Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  Secret Information
                </h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg relative group">
                    <div className="flex items-center justify-between">
                      <Badge className={getSeverityColor(secretDetail.severity)} variant="outline">
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {secretDetail.severity.toUpperCase()}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(secretDetail.secretDetail)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <p className="mt-2 font-mono text-sm break-all">{secretDetail.secret}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[32ch]">
                          {secretDetail.file}
                        </p>
                        <p className="text-xs text-muted-foreground">Line: {secretDetail.line}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">Rule</p>
                        <p className="text-xs">{secretDetail.rule}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Commit Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-blue-500" />
                  Commit Information
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-violet-500" />
                        <span className="text-sm">{secretDetail.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">{secretDetail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">
                          {format(new Date(secretDetail.date), 'PPpp')}
                        </span>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Commit Hash</span>
                      </div>
                      <p className="text-sm font-mono break-all">{secretDetail.commit}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Commit Message:</p>
                    <p className="text-sm">{secretDetail.message}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Repository Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-blue-500" />
                  Repository Information
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{secretDetail.repository.name}</span>
                      <Badge variant="secondary">{secretDetail.repository.author}</Badge>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={
                          secretDetail.repository.repoUrl.endsWith('.git')
                            ? secretDetail.repository.repoUrl.slice(0, -4)
                            : secretDetail.repository.repoUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        View Repository
                        <ArrowUpRightFromSquare className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last scanned: {format(new Date(secretDetail.repository.lastScanDate), 'PPpp')}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(SecretDetailDialog);
