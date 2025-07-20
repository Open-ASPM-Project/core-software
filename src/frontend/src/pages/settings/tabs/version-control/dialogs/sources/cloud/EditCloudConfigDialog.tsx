import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, HelpCircle, Cloud } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { CloudConfig } from '../../../types/cloud';
import { useState, useCallback } from 'react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface EditCloudConfigDialogProps {
  config: CloudConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  commonAPIRequest: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

interface CloudConfigUpdateData {
  active: boolean;
  name: string;
  credentials: {
    clientId: string;
    clientSecret: string;
  };
}

const validationSchema = Yup.object({
  active: Yup.boolean(),
  name: Yup.string().required('Name is required'),
  credentials: Yup.object({
    clientId: Yup.string().required('Client ID is required'),
    clientSecret: Yup.string().required('Client Secret is required'),
  }),
});

const EditCloudConfigDialog = ({
  config,
  open,
  onOpenChange,
  onSuccess,
  commonAPIRequest,
}: EditCloudConfigDialogProps) => {
  const [showSecrets, setShowSecrets] = useState(false);

  const formik = useFormik({
    initialValues: {
      active: config.active,
      name: config.name,
      credentials: {
        clientId: '',
        clientSecret: '',
      },
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      await updateCloudConfig(values, {
        onSuccess: () => {
          handleSuccess();
        },
        onComplete: () => {
          setSubmitting(false);
        },
      });
    },
    enableReinitialize: true,
  });

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const updateCloudConfig = useCallback(
    async (
      data: CloudConfigUpdateData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      const endpoint = API_ENDPOINTS.sources.editCloudSources;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: `${apiUrl}/${config.uuid}`,
          method: endpoint.method,
          data: {
            active: data.active,
            name: data.name,
            credentials: {
              clientId: data.credentials.clientId,
              clientSecret: data.credentials.clientSecret,
            },
          },
        },
        (response) => {
          if (response !== null) {
            callbacks.onSuccess();
          }
          callbacks.onComplete();
        }
      );
    },
    [commonAPIRequest, config.uuid]
  );

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const getCredentialDescriptions = () => {
    switch (config.cloudType) {
      case 'aws':
        return {
          id: 'AWS Access Key ID',
          secret: 'AWS Secret Access Key',
          idPlaceholder: 'Enter AWS Access Key ID',
          secretPlaceholder: 'Enter AWS Secret Access Key',
          tooltip:
            'AWS Access Keys are used to make programmatic calls to AWS API actions. You can create and manage your access keys in the AWS Management Console.',
        };
      case 'azure':
        return {
          id: 'Azure Client ID',
          secret: 'Azure Client Secret',
          idPlaceholder: 'Enter Azure Client ID',
          secretPlaceholder: 'Enter Azure Client Secret',
          tooltip:
            'The Client ID and Client Secret are from your registered Azure AD application. You can find or create these in the Azure Portal under App Registrations.',
        };
      case 'gcp':
        return {
          id: 'GCP Client ID',
          secret: 'GCP Client Secret',
          idPlaceholder: 'Enter GCP Client ID',
          secretPlaceholder: 'Enter GCP Client Secret',
          tooltip:
            'GCP Client ID and Client Secret are used for OAuth 2.0 authentication. You can create these credentials in the Google Cloud Console under APIs & Services > Credentials.',
        };
      default:
        return {
          id: 'Client ID',
          secret: 'Client Secret',
          idPlaceholder: 'Enter Client ID',
          secretPlaceholder: 'Enter Client Secret',
          tooltip:
            'The Client ID and Client Secret are used for authentication with your cloud provider.',
        };
    }
  };

  const credentialInfo = getCredentialDescriptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
              <Cloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Edit {getProviderName(config.cloudType)} Configuration
            </DialogTitle>
          </div>
          <DialogDescription className="text-center pt-2 text-gray-600 dark:text-gray-300">
            Update your cloud provider configuration settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="text-sm font-medium">
                Active
              </Label>
              <Switch
                id="active"
                name="active"
                checked={formik.values.active}
                onCheckedChange={(checked) => formik.setFieldValue('active', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter configuration name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.name && formik.errors.name ? 'border-red-500' : ''}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-sm text-red-500">{formik.errors.name}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="credentials.clientId" className="text-sm font-medium">
                    {credentialInfo.id}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>{credentialInfo.tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="credentials.clientId"
                  name="credentials.clientId"
                  type="text"
                  placeholder={credentialInfo.idPlaceholder}
                  value={formik.values.credentials.clientId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.credentials?.clientId && formik.errors.credentials?.clientId
                      ? 'border-red-500'
                      : ''
                  }
                />
                {formik.touched.credentials?.clientId && formik.errors.credentials?.clientId && (
                  <p className="text-sm text-red-500">{formik.errors.credentials.clientId}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="credentials.clientSecret" className="text-sm font-medium">
                    {credentialInfo.secret}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  id="credentials.clientSecret"
                  name="credentials.clientSecret"
                  type={showSecrets ? 'text' : 'password'}
                  placeholder={credentialInfo.secretPlaceholder}
                  value={formik.values.credentials.clientSecret}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.touched.credentials?.clientSecret &&
                    formik.errors.credentials?.clientSecret
                      ? 'border-red-500'
                      : ''
                  }
                />
                {formik.touched.credentials?.clientSecret &&
                  formik.errors.credentials?.clientSecret && (
                    <p className="text-sm text-red-500">{formik.errors.credentials.clientSecret}</p>
                  )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formik.isSubmitting}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EditCloudConfigDialog);
