import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Globe, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface SSOProvider {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface SSOResponse {
  current_page: number;
  current_limit: number;
  total_count: number;
  total_pages: number;
  data: SSOProvider[];
}

interface SSOLoginResponse {
  redirect_url?: string;
  // add other response fields if any
}

interface SSOLoginOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

const getProviderIcon = (type: string) => {
  // You can add more provider-specific icons here
  return <Globe className="h-5 w-5" />;
};

const SSOLoginOptionsDialog: React.FC<SSOLoginOptionsDialogProps> = ({
  isOpen,
  onClose,
  commonAPIRequest,
}) => {
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProvider, setProcessingProvider] = useState<number | null>(null);

  const fetchSSOOptions = () => {
    if (!commonAPIRequest) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.sso.getSSOProviders;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<SSOResponse>(
      {
        api: apiUrl + '?page=1&limit=10',
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setSSOProviders(response.data);
        } else {
          setError('Failed to load SSO options');
        }
      }
    );
  };

  const handleSSOLogin = async (provider: SSOProvider) => {
    if (!commonAPIRequest) return;

    setProcessingProvider(provider.id);
    setError(null);

    const endpoint = API_ENDPOINTS.sso.initiateSSO;
    const apiUrl = createEndpointUrl(endpoint);

    window.location.href = apiUrl + provider.name + '/login/';

    // commonAPIRequest<SSOLoginResponse>(
    //   {
    //     api: apiUrl + provider.name + '/login/',
    //     method: 'GET',
    //   },
    //   (response) => {
    //     setProcessingProvider(null);
    //     if (response?.redirect_url) {
    //       // Redirect to the SSO provider's login page
    //       window.location.href = response.redirect_url;
    //     } else {
    //       setError('Failed to initiate SSO login');
    //     }
    //   }
    // );
  };

  useEffect(() => {
    if (isOpen) {
      fetchSSOOptions();
    }
  }, [isOpen]);

  //   const handleSSOLogin = (provider: SSOProvider) => {
  //     // Handle SSO login logic here
  //     console.log(`Initiating SSO login with provider: ${provider.name}`);
  //   };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login with SSO</DialogTitle>
          <DialogDescription>Select your organization's single sign-on provider</DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : ssoProviders.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No SSO providers available</div>
          ) : (
            <div className="space-y-2">
              {ssoProviders.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full justify-between hover:bg-muted/50 group relative py-6 px-4"
                  onClick={() => handleSSOLogin(provider)}
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.type)}
                    <div className="text-left">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">{provider.type} SSO</div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(SSOLoginOptionsDialog);
