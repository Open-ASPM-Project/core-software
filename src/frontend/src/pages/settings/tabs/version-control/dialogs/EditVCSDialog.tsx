import React, { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Eye, EyeOff, Settings2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { Switch } from '@/components/ui/switch';

interface EditVCSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vcs: {
    id: number;
    name: string;
    description: string;
    type: string;
    url: string;
    token: string;
  };
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

interface VCSData {
  type: string;
  token: string;
  url: string;
  name: string;
  description: string;
  active: boolean;
}

const validationSchema = Yup.object({
  type: Yup.string().oneOf(['github', 'gitlab', 'bitbucket']).required('Type is required'),
  token: Yup.string().required('Token is required'),
  url: Yup.string().required('URL is required').url('Please enter a valid URL'),
  name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  description: Yup.string(),
  active: Yup.boolean(),
});

const EditVCSDialog: React.FC<EditVCSDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vcs,
  commonAPIRequest,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      type: '',
      token: '',
      url: '',
      name: '',
      description: '',
      active: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('values', values);
      await updateVCSIntegration(values, {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
        onComplete: () => {
          setSubmitting(false);
        },
      });
    },
  });

  useEffect(() => {
    if (isOpen && vcs) {
      // Set form values when dialog opens
      formik.setFieldValue('type', vcs.type);
      formik.setFieldValue('token', vcs.token);
      formik.setFieldValue('url', vcs.url);
      formik.setFieldValue('name', vcs.name);
      formik.setFieldValue('description', vcs.description || '');
      formik.setFieldValue('active', vcs.active);
    }
  }, [isOpen, vcs]);

  const updateVCSIntegration = React.useCallback(
    async (
      data: VCSData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.vcs.updateVcs;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: `${apiUrl}${vcs.id}`,
          method: endpoint.method,
          data:
            data?.token === vcs.token
              ? {
                  type: data.type,
                  url: data.url,
                  name: data.name,
                  description: data.description,
                  active: data.active,
                }
              : {
                  type: data.type,
                  token: data.token,
                  url: data.url,
                  name: data.name,
                  description: data.description,
                  active: data.active,
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
    [commonAPIRequest, vcs.id]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Settings2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Edit VCS Integration</DialogTitle>
              <DialogDescription>
                Update your version control system integration settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6 p-6 pt-0">
          <div className="grid gap-4 py-4">
            {/* Integration Type */}
            <div className="space-y-2">
              <Label>Integration Type</Label>
              <Select
                name="type"
                onValueChange={(value) => formik.setFieldValue('type', value)}
                value={formik.values.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VCS type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                  <SelectItem value="bitbucket">Bitbucket</SelectItem>
                </SelectContent>
              </Select>
              {formik.touched.type && formik.errors.type && (
                <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formik.errors.type}
                </p>
              )}
            </div>

            {/* Integration Name */}
            <div className="space-y-2">
              <Label>Integration Name</Label>
              <div className="relative">
                <Input
                  {...formik.getFieldProps('name')}
                  placeholder="Enter integration name"
                  className={
                    formik.touched.name && formik.errors.name
                      ? 'border-red-500 ring-red-200 placeholder-red-400'
                      : ''
                  }
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formik.errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...formik.getFieldProps('description')}
                placeholder="Enter integration description"
                className={`resize-none ${
                  formik.touched.description && formik.errors.description
                    ? 'border-red-500 ring-red-200 placeholder-red-400'
                    : ''
                }`}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formik.errors.description}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle to enable or disable this integration
                </p>
              </div>
              <Switch
                checked={formik.values.active}
                onCheckedChange={(checked) => formik.setFieldValue('active', checked)}
                aria-label="Toggle active status"
              />
            </div>

            {/* Access Token */}
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...formik.getFieldProps('token')}
                    placeholder="Enter access token"
                    className={
                      formik.touched.token && formik.errors.token
                        ? 'border-red-500 ring-red-200 placeholder-red-400 pr-10'
                        : 'pr-10'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formik.touched.token && formik.errors.token && (
                  <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formik.errors.token}
                  </p>
                )}
              </div>
            </div>

            {/* API URL */}
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                {...formik.getFieldProps('url')}
                placeholder="https://api.github.com"
                className={
                  formik.touched.url && formik.errors.url
                    ? 'border-red-500 ring-red-200 placeholder-red-400'
                    : ''
                }
              />
              {formik.touched.url && formik.errors.url && (
                <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formik.errors.url}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
                  Updating...
                </>
              ) : (
                'Update Integration'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EditVCSDialog);
