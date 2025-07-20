import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_BASE_URLS, API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddSSOConfigDialogProps {
  onSuccess: () => void;
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

interface SSOConfigData {
  name: string; // Add this
  type: 'Okta' | 'Azure' | 'Google';
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  type: Yup.string()
    .oneOf(['Okta', 'Azure', 'Google'], 'Please select a valid SSO provider')
    .required('Provider type is required'),
  issuer: Yup.string().url('Please enter a valid URL').required('Issuer URL is required'),
  authorizationUrl: Yup.string()
    .url('Please enter a valid URL')
    .required('Authorization URL is required'),
  tokenUrl: Yup.string().url('Please enter a valid URL').required('Token URL is required'),
  userInfoUrl: Yup.string().url('Please enter a valid URL').required('User Info URL is required'),
  clientId: Yup.string().required('Client ID is required'),
  clientSecret: Yup.string().required('Client Secret is required'),
  callbackUrl: Yup.string().url('Please enter a valid URL').required('Callback URL is required'),
});

const AddSSOConfigDialog: React.FC<AddSSOConfigDialogProps> = ({ onSuccess, commonAPIRequest }) => {
  const [open, setOpen] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);

  const addSSOConfig = React.useCallback(
    async (
      data: SSOConfigData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.sso.createConfig;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: apiUrl + `/${data.name}`,
          method: endpoint.method,
          data: {
            type: data.type,
            issuer: data.issuer,
            authorizationUrl: data.authorizationUrl,
            tokenUrl: data.tokenUrl,
            userInfoUrl: data.userInfoUrl,
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            callbackUrl: data.callbackUrl,
          },
        },
        (response) => {
          if (response) {
            callbacks.onSuccess();
          }
          callbacks.onComplete();
        }
      );
    },
    [commonAPIRequest]
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'Okta' as const,
      issuer: '',
      authorizationUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      clientId: '',
      clientSecret: '',
      callbackUrl: API_BASE_URLS.development + '/sso/callback',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      await addSSOConfig(values, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          onSuccess();
        },
        onComplete: () => {
          setSubmitting(false);
        },
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg">
          <Key className="h-4 w-4 mr-2" />
          Add SSO Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Key className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Add SSO Provider</DialogTitle>
              <DialogDescription>Configure a new Single Sign-On provider.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[600px]">
          <form onSubmit={formik.handleSubmit} className="space-y-6 p-6 pt-0">
            <div className="grid gap-4 py-4 ">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter SSO provider name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Provider Type</Label>
                <Select
                  name="type"
                  onValueChange={(value) => formik.setFieldValue('type', value)}
                  defaultValue={formik.values.type}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Okta">Okta</SelectItem>
                    <SelectItem value="AzureAD">Azure AD</SelectItem>
                    <SelectItem value="Google">Google Workspace</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Apple">Apple</SelectItem>
                    <SelectItem value="Github">Github</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.type && formik.errors.type && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer URL</Label>
                <Input
                  id="issuer"
                  name="issuer"
                  placeholder="https://your-domain.okta.com"
                  value={formik.values.issuer}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.issuer && formik.errors.issuer && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.issuer}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorizationUrl">Authorization URL</Label>
                <Input
                  id="authorizationUrl"
                  name="authorizationUrl"
                  placeholder="https://your-domain.okta.com/oauth2/v1/authorize"
                  value={formik.values.authorizationUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.authorizationUrl && formik.errors.authorizationUrl && (
                  <p className="text-xs font-medium text-red-500">
                    {formik.errors.authorizationUrl}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenUrl">Token URL</Label>
                <Input
                  id="tokenUrl"
                  name="tokenUrl"
                  placeholder="https://your-domain.okta.com/oauth2/v1/token"
                  value={formik.values.tokenUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.tokenUrl && formik.errors.tokenUrl && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.tokenUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userInfoUrl">User Info URL</Label>
                <Input
                  id="userInfoUrl"
                  name="userInfoUrl"
                  placeholder="https://your-domain.okta.com/oauth2/v1/userinfo"
                  value={formik.values.userInfoUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.userInfoUrl && formik.errors.userInfoUrl && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.userInfoUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  name="clientId"
                  placeholder="Enter client ID"
                  value={formik.values.clientId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.clientId && formik.errors.clientId && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.clientId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="clientSecret"
                    name="clientSecret"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="Enter client secret"
                    value={formik.values.clientSecret}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formik.touched.clientSecret && formik.errors.clientSecret && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.clientSecret}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="callbackUrl">Callback URL</Label>
                <Input
                  id="callbackUrl"
                  name="callbackUrl"
                  placeholder="https://your-app.com/auth/callback"
                  value={formik.values.callbackUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.callbackUrl && formik.errors.callbackUrl && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.callbackUrl}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
              >
                {formik.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create SSO Provider'
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddSSOConfigDialog);
