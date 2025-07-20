import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, KeyRound, Globe, Shield } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { toast } from 'sonner';
import { SelectVC } from '@/components/filter/SelectVC';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Textarea } from '@/components/ui/textarea';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface AddAllowlistFromSecretProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secretName: string;
  commonAPIRequest?: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
  onSuccess: () => void;
}

interface Repository {
  id: number;
  name: string;
}

interface VersionControl {
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

const validationSchema = yup.object().shape({
  name: yup.string().required('Name is required').min(3, 'Name must be at least 3 characters'),
  active: yup.boolean(),
  global_: yup.boolean(),
  repos: yup
    .array()
    .of(yup.number())
    .when('global_', {
      is: false,
      then: (schema) => schema.min(1, 'At least one repository must be selected'),
    }),
  vcs: yup.array().of(yup.number()).min(1, 'At least one version control must be selected'),
  comment: yup.string().max(500, 'Comment must not exceed 500 characters'),
});

const AddAllowlistFromSecret: React.FC<AddAllowlistFromSecretProps> = ({
  open,
  onOpenChange,
  secretName,
  commonAPIRequest,
  onSuccess,
}) => {
  const [selectedRepos, setSelectedRepos] = React.useState<Repository[]>([]);
  const [selectedVCs, setSelectedVCs] = React.useState<VersionControl[]>([]);

  const formik = useFormik({
    initialValues: {
      type: 'SECRET',
      name: '',
      active: true,
      global_: false,
      repos: [],
      vcs: [],
      comment: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          repos: selectedRepos.map((repo) => repo.id),
          vcs: selectedVCs.map((vc) => vc.id),
        };

        await createAllowList(payload);

        toast.success('Allow list added successfully');
        onOpenChange(false);
        onSuccess();
        handleFormReset();
      } catch (error) {
        toast.error('Failed to create allow list');
        console.log('error', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const createAllowList = async (payload: any) => {
    const endpoint = API_ENDPOINTS.allowList.addAllowList;
    const api = createEndpointUrl(endpoint);

    return new Promise((resolve, reject) => {
      commonAPIRequest(
        {
          api,
          method: endpoint.method,
          data: payload,
        },
        (response) => {
          if (response) {
            resolve(response);
          } else {
            reject(new Error('Failed to create allow list'));
          }
        }
      );
    });
  };

  const handleFormReset = () => {
    formik.resetForm();
    setSelectedRepos([]);
    setSelectedVCs([]);
  };

  React.useEffect(() => {
    formik.setFieldValue(
      'repos',
      selectedRepos.map((repo) => repo.id)
    );
  }, [selectedRepos]);

  React.useEffect(() => {
    formik.setFieldValue(
      'vcs',
      selectedVCs.map((vc) => vc.id)
    );
  }, [selectedVCs]);

  React.useEffect(() => {
    if (open) {
      formik.setFieldValue('name', secretName);
    }
  }, [open, secretName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 
          dark:from-purple-600/20 dark:to-blue-600/20 
          border-b border-purple-100 dark:border-purple-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <KeyRound className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle>Add New Allow List from Secret</DialogTitle>
              <DialogDescription>
                Create a new allow list from a secret to manage your security exceptions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6">
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter name"
                disabled={true}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-xs text-red-500">{formik.errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`relative rounded-lg border-2 transition-all duration-200 cursor-pointer p-4 
    ${
      formik.values.active
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-400'
        : 'border-gray-200 hover:border-purple-200 dark:border-gray-700 dark:hover:border-purple-700'
    }`}
              >
                <div className="absolute right-4 top-4">
                  <Checkbox
                    id="active"
                    name="active"
                    checked={formik.values.active}
                    onCheckedChange={(checked) => {
                      if (checked !== formik.values.active) {
                        formik.setFieldValue('active', checked);
                      }
                    }}
                    className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                </div>
                <Label
                  htmlFor="active"
                  className="block h-full w-full cursor-pointer"
                  onClick={() => {
                    formik.setFieldValue('active', !formik.values.active);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-md 
            ${
              formik.values.active
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Active</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow list will be enforced when active
                    </p>
                  </div>
                </Label>
              </div>

              <div
                className={`relative rounded-lg border-2 transition-all duration-200 cursor-pointer p-4 
    ${
      formik.values.global_
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-400'
        : 'border-gray-200 hover:border-blue-200 dark:border-gray-700 dark:hover:border-blue-700'
    }`}
              >
                <div className="absolute right-4 top-4">
                  <Checkbox
                    id="global_"
                    name="global_"
                    checked={formik.values.global_}
                    onCheckedChange={(checked) => {
                      if (checked !== formik.values.global_) {
                        formik.setFieldValue('global_', checked);
                      }
                    }}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                </div>
                <Label
                  htmlFor="global_"
                  className="block h-full w-full cursor-pointer"
                  onClick={() => {
                    formik.setFieldValue('global_', !formik.values.global_);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-md 
            ${
              formik.values.global_
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
                      >
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Global</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Apply this allow list globally to all repositories
                    </p>
                  </div>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <SelectVC
                label="Select Version Controls"
                selectedValues={selectedVCs}
                onSelectedChange={setSelectedVCs}
              />
              {formik.touched.vcs && formik.errors.vcs && (
                <p className="text-xs text-red-500">{formik.errors.vcs}</p>
              )}
            </div>

            <div className="space-y-2">
              <SelectRepo
                label="Select Repositories"
                selectedValues={selectedRepos}
                onSelectedChange={setSelectedRepos}
                disabled={formik.values.global_}
              />
              {formik.touched.repos && formik.errors.repos && (
                <p className="text-xs text-red-500">{formik.errors.repos}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                name="comment"
                value={formik.values.comment}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Add a comment about this allow list..."
                className="min-h-[100px] resize-none"
              />
              {formik.touched.comment && formik.errors.comment && (
                <p className="text-xs text-red-500">{formik.errors.comment}</p>
              )}
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  handleFormReset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-600 dark:to-blue-600 dark:hover:from-purple-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
              >
                {formik.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Allow List'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddAllowlistFromSecret);
