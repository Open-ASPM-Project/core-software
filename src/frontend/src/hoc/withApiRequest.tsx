import React from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';

// Define the possible HTTP methods
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Interface for API request parameters
interface APIRequestParams {
  api: string;
  method: HTTPMethod;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

// Interface for the injected props
interface WithAPIRequestProps {
  commonAPIRequest: <T>(
    requestParams: APIRequestParams,
    callback: (response: T | null) => void
  ) => void;
}

// Custom Error Alert Dialog Component
interface ErrorAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const ErrorAlertDialog: React.FC<ErrorAlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-red-600 dark:text-red-400">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center pt-2 text-gray-600 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-medium px-8 transition-colors"
          >
            Dismiss
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Type for the wrapped component props
type WrappedComponentProps<P> = P & WithAPIRequestProps;

// HOC function with proper generic types
export function withAPIRequest<P extends object>(
  WrappedComponent: React.ComponentType<WrappedComponentProps<P>>
): React.ComponentType<P> {
  const WithAPIRequest: React.FC<P> = (props) => {
    const { logout, isAuthenticated } = useAuth();

    const [showError, setShowError] = React.useState(false);
    const [errorDetails, setErrorDetails] = React.useState({
      title: '',
      description: '',
    });

    const commonAPIRequest = async <T,>(
      { api, method, params, data }: APIRequestParams,
      callback: (response: T | null) => void
    ): Promise<void> => {
      const token = localStorage.getItem('token') || null;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      };

      const config: AxiosRequestConfig = {
        method,
        url: api,
        headers,
        params,
        data: data || params, // If params exist and no data, use params as data
      };

      try {
        const response: AxiosResponse<T> = await axios(config);

        if (response?.status === 200 || response?.status === 201) {
          callback(response.data);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('API Request Error:', error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            if (isAuthenticated) {
              logout();
            } else {
              setShowError(true);
              setErrorDetails({
                title: 'Error',
                description: error.response?.data?.detail
                  ? error.response?.data?.detail
                  : 'Something went wrong. Please try again later.',
              });
            }
          } else if (error.response?.status === 404) {
            console.log('not found');
            callback(null);
          } else if (error.response?.status === 403) {
            setShowError(true);
            setErrorDetails({
              title: 'Error',
              description: error.response?.data?.detail
                ? error.response?.data?.detail
                : 'Access Denied. Please contact admin.',
            });
          } else {
            // Show error dialog with appropriate message
            setErrorDetails({
              title: 'Error',
              description: error.response?.data?.detail
                ? error.response?.data?.detail
                : 'Something went wrong. Please try again later.',
            });
            setShowError(true);
          }
        }
        callback(null);
      }
    };

    const handleCloseError = () => {
      setShowError(false);
      setErrorDetails({ title: '', description: '' });
    };

    return (
      <>
        <WrappedComponent {...props} commonAPIRequest={commonAPIRequest} />
        <ErrorAlertDialog
          isOpen={showError}
          onClose={handleCloseError}
          title={errorDetails.title}
          description={errorDetails.description}
        />
      </>
    );
  };

  // Display name for debugging
  WithAPIRequest.displayName = `WithAPIRequest(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAPIRequest;
}
