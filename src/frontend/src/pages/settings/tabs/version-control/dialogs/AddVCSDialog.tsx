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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Github, Gitlab, Plus, Loader2, AlertCircle, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface AddVCSDialogProps {
  onSuccess?: () => void;
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
}

const validationSchema = Yup.object({
  type: Yup.string().oneOf(['github', 'gitlab', 'bitbucket']).required('Type is required'),
  token: Yup.string().required('Token is required'),
  url: Yup.string().required('URL is required').url('Please enter a valid URL'),
  name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  description: Yup.string(),
});

const AddVCSDialog: React.FC<AddVCSDialogProps> = ({ onSuccess, commonAPIRequest }) => {
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  console.log('commonAPIRequest', commonAPIRequest);
  const formik = useFormik({
    initialValues: {
      type: 'github',
      token: '',
      url: '',
      name: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      console.log('values', values);

      await addVCSIntegration(values, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          onSuccess?.();
        },
        onComplete: () => {
          setSubmitting(false);
        },
      });
    },
  });

  const addVCSIntegration = React.useCallback(
    async (
      data: VCSData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      // console.log('commonAPIRequest', commonAPIRequest);
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.vcs.addVcs;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
          data: {
            type: data.type,
            token: data.token,
            url: data.url,
            name: data.name,
            description: data.description,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Version Control
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Github className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Add VCS Integration</DialogTitle>
              <DialogDescription>
                Connect your version control system to enable repository management.
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
                defaultValue={formik.values.type}
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

            {/* Access Token */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Access Token</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-3 bg-white dark:bg-gray-900 border dark:border-gray-800">
                      <div className="space-y-3 text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <p className="font-semibold mb-1">GitHub & GitLab:</p>
                          <p className="text-gray-700 dark:text-gray-300">Required permissions:</p>
                          <ul className="list-disc ml-4 mt-1 text-gray-600 dark:text-gray-400">
                            <li>read_api</li>
                            <li>read_repo</li>
                            <li>write_repo</li>
                          </ul>
                        </div>
                        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                          <p className="font-semibold mb-1">Bitbucket:</p>
                          <p className="text-gray-700 dark:text-gray-300">
                            Format: username:&lt;api-token&gt;
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
              <div className="flex items-center gap-2">
                <Label>API URL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-3 bg-white dark:bg-gray-900 border dark:border-gray-800">
                      <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            GitHub:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            https://api.github.com/orgs/&lt;org-name&gt;/repos
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            GitLab:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            https://gitlab.com/api/v4/groups/&lt;group-id&gt;/projects
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Bitbucket:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            https://api.bitbucket.org/2.0/repositories/&lt;workspace-id&gt;
                          </span>
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Integration'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddVCSDialog);
