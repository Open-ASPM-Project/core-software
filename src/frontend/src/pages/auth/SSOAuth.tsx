import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import EulaDialog from '@/components/dialogs/EulaDialog';

interface DecodedToken {
  exp: number;
  iat: number;
  role: string;
  user_id: number;
  username: string;
}

interface TokenResponse {
  access_token: string;
}

interface EulaResponse {
  id: number;
  accepted: boolean;
  acceptedAt: string;
  createdAt: string;
}

interface SSOAuthProps {
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

const SSOAuth: React.FC<SSOAuthProps> = ({ commonAPIRequest }) => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showEulaDialog, setShowEulaDialog] = useState(false);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const checkEulaAndProceed = async () => {
    if (!commonAPIRequest) {
      setError('API request not available');
      return;
    }

    const endpoint = API_ENDPOINTS.auth.checkEula;
    commonAPIRequest<EulaResponse>(
      {
        api: createEndpointUrl(endpoint),
        method: endpoint.method,
      },
      (response) => {
        if (response) {
          if (!response.accepted) {
            setShowEulaDialog(true);
          } else {
            exchangeCodeForToken();
          }
        }
      }
    );
  };

  const exchangeCodeForToken = async () => {
    try {
      if (!code || !state) {
        setError('Missing required authentication parameters');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!commonAPIRequest) {
        setError('API request not available');
        return;
      }

      const endpoint = API_ENDPOINTS.sso.exchangeSSO;
      commonAPIRequest<TokenResponse>(
        {
          api: createEndpointUrl(endpoint),
          method: 'GET',
          params: { code, state },
        },
        async (response) => {
          if (response?.access_token) {
            try {
              const decoded = jwtDecode<DecodedToken>(response.access_token);
              localStorage.setItem('role', decoded.role);
              localStorage.setItem('userId', decoded.user_id.toString());
              localStorage.setItem('username', decoded.username);
              login(response.access_token);
              navigate('/');
            } catch (decodeError) {
              console.error('Error decoding token:', decodeError);
              setError('Failed to process authentication token');
              setTimeout(() => navigate('/login'), 2000);
            }
          } else {
            setError('Failed to obtain access token');
            setTimeout(() => navigate('/login'), 2000);
          }
        }
      );
    } catch (error) {
      console.error('Error during SSO authentication:', error);
      setError('Failed to complete SSO authentication');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const handleEulaAccept = () => {
    setShowEulaDialog(false);
    exchangeCodeForToken();
  };

  useEffect(() => {
    checkEulaAndProceed();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <div className="text-sm text-muted-foreground">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-sm text-muted-foreground">Completing SSO authentication...</div>
      </div>

      {showEulaDialog && (
        <EulaDialog
          isOpen={showEulaDialog}
          onClose={() => {
            setShowEulaDialog(false);
            navigate('/login');
          }}
          onAccept={handleEulaAccept}
          commonAPIRequest={commonAPIRequest}
        />
      )}
    </>
  );
};

export default withAPIRequest(SSOAuth);
