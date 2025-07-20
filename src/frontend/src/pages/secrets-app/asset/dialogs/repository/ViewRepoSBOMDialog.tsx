import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, FileCode2, Link2, AlertCircle, Loader2, Download } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ViewRepoSBOMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoId: number;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

interface SBOMData {
  repo_name: string;
  repo_url: string;
  sbom: {
    artifacts: any[];
    artifactRelationships: any[];
    source: {
      id: string;
      name: string;
      version: string;
      type: string;
      metadata: {
        path: string;
      };
    };
    distro: Record<string, unknown>;
    descriptor: {
      name: string;
      version: string;
      configuration: Record<string, unknown>;
    };
    schema: {
      version: string;
      url: string;
    };
  };
}

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-sm text-muted-foreground">Loading SBOM details...</p>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <Alert variant="destructive" className="m-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);

const ViewRepoSBOMDialog: React.FC<ViewRepoSBOMDialogProps> = ({
  open,
  onOpenChange,
  repoId,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sbomData, setSbomData] = React.useState<SBOMData | null>(null);
  const [branchName, setBranchName] = React.useState<string>('');

  const fetchSBOMDetails = React.useCallback(
    (bName?: string) => {
      if (!repoId) return;

      setIsLoading(true);
      setError(null);

      const endpoint = API_ENDPOINTS.repository.getRepositorySBOM;
      const api = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: api + repoId + '/sbom',
          method: endpoint.method,
          params: bName ? { branch: bName } : undefined,
        },
        (response) => {
          setIsLoading(false);
          if (response) {
            setSbomData(response);
          } else {
            setError('Failed to fetch SBOM details');
          }
        }
      );
    },
    [repoId, commonAPIRequest]
  );

  const downloadSBOM = React.useCallback(
    async (bName?: string) => {
      if (!repoId || !sbomData) return;

      try {
        const endpoint = API_ENDPOINTS.repository.getRepositorySBOM;
        const api = createEndpointUrl(endpoint);

        commonAPIRequest(
          {
            api: api + 'repo/' + repoId + '/sbom/download',
            method: endpoint.method,
            params: bName ? { branch: bName } : undefined,
          },
          (response) => {
            if (response) {
              // Create blob and download
              const blob = new Blob([JSON.stringify(response, null, 2)], {
                type: 'application/json',
              });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `sbom-${sbomData.repo_name}.json`;
              link.click();
              window.URL.revokeObjectURL(url);
            }
          }
        );
      } catch (error) {
        console.error('Error downloading SBOM:', error);
      }
    },
    [repoId, sbomData, commonAPIRequest]
  );

  React.useEffect(() => {
    if (open) {
      fetchSBOMDetails();
    } else {
      setSbomData(null);
      setError(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setSbomData(null);
      setError(null);
      setBranchName('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-600/20 dark:to-indigo-600/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Software Bill of Materials</DialogTitle>
                {sbomData && (
                  <div className="flex items-center gap-2 mt-2">
                    <FileCode2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{sbomData.repo_name}</span>
                  </div>
                )}
              </div>
            </div>
            {sbomData && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild className="h-8">
                  <a
                    href={sbomData.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    View Repository
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  onClick={() => downloadSBOM(branchName)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download SBOM
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/*  */}

        <div className="px-6 py-4 border-b bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="w-full">
              <Label htmlFor="branch" className="text-sm">
                Branch Name
              </Label>
              <Input
                id="branch"
                placeholder="Enter branch name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-5 h-8"
              onClick={() => fetchSBOMDetails(branchName)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 'Fetch SBOM'}
            </Button>
          </div>
        </div>

        {/*  */}
        <ScrollArea className="max-h-[80vh]">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} />
          ) : sbomData ? (
            <div className="p-6 space-y-6">
              {/* Source Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-blue-500" />
                  Source Information
                </h3>
                <div className="grid gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Source ID</p>
                      <p className="font-mono text-sm">
                        {sbomData.sbom.source.id.length > 32
                          ? `${sbomData.sbom.source.id.slice(0, 32)}...`
                          : sbomData.sbom.source.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Source Type</p>
                      <Badge variant="secondary">{sbomData.sbom.source.type}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Source Path</p>
                    <p className="font-mono text-sm">{sbomData.sbom.source.metadata.path}</p>
                  </div>
                </div>
              </div>

              {/* Scanner Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Scanner Details
                </h3>
                <div className="grid gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Scanner Name</p>
                      <Badge>{sbomData.sbom.descriptor.name}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Scanner Version</p>
                      <Badge variant="outline">{sbomData.sbom.descriptor.version}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Schema Version</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{sbomData.sbom.schema.version}</Badge>
                      <Button size="sm" variant="outline" asChild className="h-7">
                        <a
                          href={sbomData.sbom.schema.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <Link2 className="h-3 w-3" />
                          View Schema
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Artifacts Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Artifacts Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total Artifacts</p>
                    <p className="text-2xl font-bold">{sbomData.sbom.artifacts.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total Relationships</p>
                    <p className="text-2xl font-bold">
                      {sbomData.sbom.artifactRelationships.length}
                    </p>
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

export default withAPIRequest(ViewRepoSBOMDialog);
