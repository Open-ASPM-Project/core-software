import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
// import AddSSOConfigDialog from './dialogs/AddSSOConfigDialog';
import SSOConfigTable from './table/SSOConfigTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AddSSOConfigDialog from './dialogs/AddSSOConfigDialog';

interface SSOConfig {
  id: number;
  provider_name: string;
  client_id: string;
  tenant_id?: string;
  metadata_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by_uid: number;
  updated_by_uid: number;
}

interface PaginatedResponse {
  data: SSOConfig[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface SSOConfigTabProps {
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

const SSOConfigTab: React.FC<SSOConfigTabProps> = ({ commonAPIRequest }) => {
  const [ssoConfigs, setSSOConfigs] = useState<SSOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchSSOConfigs = (page: number = 1, limit: number = itemsPerPage) => {
    if (!commonAPIRequest) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.sso.getConfigs;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<PaginatedResponse>(
      {
        api: `${apiUrl}?page=${page}&limit=${limit}${searchQuery ? `&search=${searchQuery}` : ''}`,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setSSOConfigs(response.data);
          setCurrentPage(response.current_page);
          setTotalPages(response.total_pages);
          setTotalCount(response.total_count);
          setItemsPerPage(response.current_limit);
        } else {
          setError('Failed to fetch SSO configurations');
        }
      }
    );
  };

  useEffect(() => {
    fetchSSOConfigs();
  }, [searchQuery]); // Refetch when search query changes

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSSOConfigs(page);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SSO Configurations</CardTitle>
              <CardDescription>Manage Single Sign-On provider configurations.</CardDescription>
            </div>
            <AddSSOConfigDialog onSuccess={fetchSSOConfigs} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SSO configurations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <SSOConfigTable
              ssoConfigs={ssoConfigs}
              isLoading={isLoading}
              onSuccess={fetchSSOConfigs}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {ssoConfigs?.length} of {totalCount} configurations
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(currentPage - page) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withAPIRequest(SSOConfigTab);
