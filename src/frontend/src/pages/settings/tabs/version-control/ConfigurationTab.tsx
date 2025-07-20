import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import AddVCSDialog from './dialogs/AddVCSDialog';
import VCSTable from './tables/VCSTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CloudConfigGrid from './grid/sources/cloud/CloudConfigGrid';
import AddCloudConfigDialog from './dialogs/sources/cloud/AddCloudConfigDialog';

interface VCSConfigResponse {
  id: number;
  name: string;
  description: string;
  type: 'github' | 'gitlab' | 'bitbucket';
  token: string;
  url: string;
  added_by_user_id: number;
  created_by: number;
  updated_by: number;
  active: boolean;
}

interface CloudConfigItem {
  id: number;
  uuid: string;
  type: string;
  name: string;
  cloudType: 'aws' | 'azure' | 'gcp';
  cloudTypeLabel: string;
  sourceType: string;
  awsAccessKey: string | null;
  awsSecretKey: string | null;
  gcpServiceAccountKey: string | null;
  clientId: string | null;
  clientSecret: string | null;
  tenantId: string | null;
  subscriptionId: string | null;
  digitaloceanToken: string | null;
  scalewayAccessKey: string | null;
  scalewayAccessToken: string | null;
  apiKey: string | null;
  email: string | null;
  herokuApiToken: string | null;
  fastlyApiKey: string | null;
  linodePersonalAccessToken: string | null;
  namecheapApiKey: string | null;
  namecheapUserName: string | null;
  alibabaRegionId: string | null;
  alibabaAccessKey: string | null;
  alibabaAccessKeySecret: string | null;
  tfStateFile: string | null;
  consulUrl: string | null;
  nomadUrl: string | null;
  authToken: string | null;
  kubeconfigFile: string | null;
  kubeconfigEncoded: string | null;
  dnssimpleApiToken: string | null;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  addedByUid: number;
  updatedByUid: number;
  scheduleId: number | null;
}

interface VCSAPIResponse {
  data: VCSConfigResponse[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface CloudAPIResponse {
  data: CloudConfigItem[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

// Type definition for commonAPIRequest
type CommonAPIRequestType = <T>(
  requestParams: {
    api: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: Record<string, unknown>;
    data?: Record<string, unknown>;
  },
  onSuccess: (response: T | null) => void,
  onError?: (error: Error) => void
) => void;

const ConfigurationTab = ({ commonAPIRequest }: { commonAPIRequest: CommonAPIRequestType }) => {
  // State for VCS configurations
  const [isLoadingVCS, setIsLoadingVCS] = useState(false);
  const [vcsConfigs, setVCSConfigs] = useState<VCSConfigResponse[]>([]);
  const [vcsPagination, setVCSPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
  });

  // State for Cloud configurations
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudConfigs, setCloudConfigs] = useState<CloudConfigItem[]>([]);
  const [cloudPagination, setCloudPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
  });

  // State for the config navigation
  const [selectedConfig, setSelectedConfig] = useState('version-control');

  // Fetch VCS configurations
  const fetchVCSConfigs = useCallback(
    (page: number = 1, limit: number = 10) => {
      setIsLoadingVCS(true);

      const endpoint = API_ENDPOINTS.vcs.getVcs;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest<VCSAPIResponse>(
        {
          api: `${apiUrl}?page=${page}&limit=${limit}`,
          method: endpoint.method,
        },
        (response) => {
          setIsLoadingVCS(false);
          if (response) {
            setVCSConfigs(response.data);
            setVCSPagination({
              currentPage: response.current_page,
              totalPages: response.total_pages,
              pageSize: response.current_limit,
              totalCount: response.total_count,
            });
          }
        },
        (error: Error) => {
          setIsLoadingVCS(false);
          console.error('Failed to fetch VCS configurations:', error);
        }
      );
    },
    [commonAPIRequest]
  );

  // Fetch Cloud configurations
  const fetchCloudConfigs = useCallback(
    (page: number = 1, limit: number = 10) => {
      setIsLoadingCloud(true);

      const endpoint = API_ENDPOINTS.sources.getSources;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest<CloudAPIResponse>(
        {
          api: `${apiUrl}?page=${page}&limit=${limit}`,
          method: endpoint.method,
          data: {
            filters: [],
          },
        },
        (response) => {
          setIsLoadingCloud(false);
          if (response) {
            setCloudConfigs(response.data);
            setCloudPagination({
              currentPage: response.current_page,
              totalPages: response.total_pages,
              pageSize: response.current_limit,
              totalCount: response.total_count,
            });
          }
        },
        (error: Error) => {
          setIsLoadingCloud(false);
          console.error('Failed to fetch cloud configurations:', error);
        }
      );
    },
    [commonAPIRequest]
  );

  // Load initial data when component mounts based on selected config
  useEffect(() => {
    if (selectedConfig === 'version-control') {
      fetchVCSConfigs();
    } else if (selectedConfig === 'cloud') {
      fetchCloudConfigs();
    }
  }, [selectedConfig]);

  // Handle pagination for VCS configs
  const handleVCSPageChange = (page: number) => {
    fetchVCSConfigs(page, vcsPagination.pageSize);
  };

  const handleVCSPageSizeChange = (newPageSize: number) => {
    fetchVCSConfigs(1, newPageSize);
  };

  // Handle config selection
  const handleConfigSelect = (id: string) => {
    setSelectedConfig(id);
  };

  // Determine which title and description to show based on selected config
  const getTitleAndDescription = () => {
    switch (selectedConfig) {
      case 'version-control':
        return {
          title: 'Version Control Systems',
          description: 'Manage your VCS integrations and repositories',
        };
      case 'cloud':
        return {
          title: 'Cloud Sources',
          description: 'Configure your cloud connections and integrations',
        };
      default:
        return {
          title: 'Configuration',
          description: 'Manage your system configurations',
        };
    }
  };

  // Find the selected menu item label
  const getSelectedMenuLabel = () => {
    switch (selectedConfig) {
      case 'version-control':
        return 'Version Control';
      case 'cloud':
        return 'Cloud';
      default:
        return 'Select Configuration';
    }
  };

  const { title, description } = getTitleAndDescription();

  // Function to render the appropriate content based on the selected tab
  const renderContent = () => {
    switch (selectedConfig) {
      case 'version-control':
        return (
          <VCSTable
            data={vcsConfigs}
            isLoading={isLoadingVCS}
            pagination={{
              currentPage: vcsPagination.currentPage,
              totalPages: vcsPagination.totalPages,
              pageSize: vcsPagination.pageSize,
              totalCount: vcsPagination.totalCount,
              onPageChange: handleVCSPageChange,
              onPageSizeChange: handleVCSPageSizeChange,
            }}
            onSuccess={() => fetchVCSConfigs(vcsPagination.currentPage, vcsPagination.pageSize)}
            commonAPIRequest={commonAPIRequest}
          />
        );
      case 'cloud':
        return (
          <CloudConfigGrid
            data={{
              current_page: cloudPagination.currentPage,
              current_limit: cloudPagination.pageSize,
              total_count: cloudPagination.totalCount,
              total_pages: cloudPagination.totalPages,
              data: cloudConfigs,
            }}
            isLoading={isLoadingCloud}
            onSuccess={() =>
              fetchCloudConfigs(cloudPagination.currentPage, cloudPagination.pageSize)
            }
            commonAPIRequest={commonAPIRequest}
          />
        );
      default:
        return null;
    }
  };

  // Function to render the appropriate action button based on the selected tab
  const renderActionButton = () => {
    if (selectedConfig === 'version-control') {
      return <AddVCSDialog onSuccess={fetchVCSConfigs} />;
    } else if (selectedConfig === 'cloud') {
      return <AddCloudConfigDialog onSuccess={fetchCloudConfigs} />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 p-3 rounded-md bg-purple-50 dark:bg-purple-800/30 border border-purple-100 dark:border-purple-700">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-1 bg-primary rounded-full"></div>
          <h3 className="text-sm font-medium">Configuration Type</h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-between">
              {getSelectedMenuLabel()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px]">
            <DropdownMenuItem
              className={
                selectedConfig === 'version-control' ? 'bg-accent text-accent-foreground' : ''
              }
              onSelect={() => handleConfigSelect('version-control')}
            >
              Version Control
            </DropdownMenuItem>
            <DropdownMenuItem
              className={selectedConfig === 'cloud' ? 'bg-accent text-accent-foreground' : ''}
              onSelect={() => handleConfigSelect('cloud')}
            >
              Cloud
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            </div>
            {renderActionButton()}
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
};

export default withAPIRequest(ConfigurationTab);
