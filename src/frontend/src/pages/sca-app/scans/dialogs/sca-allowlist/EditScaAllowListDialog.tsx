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
import { Loader2, ShieldCheck, Globe, Shield } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { toast } from 'sonner';
import { SelectVC } from '@/components/filter/SelectVC';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { Textarea } from '@/components/ui/textarea';

interface Repository {
  id: number;
  name: string;
}

interface VersionControl {
  id: number;
  name: string;
  type: 'github' | 'gitlab' | 'bitbucket';
}

interface AllowList {
  id: number;
  name: string;
  active: boolean;
  global_: boolean;
  vcs: VersionControl[];
  repos: Repository[];
}

interface EditScaAllowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowList: AllowList;
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

const validationSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  // .min(3, 'Name must be at least 3 characters')
  // .max(50, 'Name must not exceed 50 characters'),
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

const EditScaAllowListDialog: React.FC<EditScaAllowListDialogProps> = ({
  open,
  onOpenChange,
  allowList,
  commonAPIRequest,
  onSuccess,
}) => {
  const [selectedRepos, setSelectedRepos] = React.useState<Repository[]>(allowList.repos);
  const [selectedVCs, setSelectedVCs] = React.useState<VersionControl[]>(allowList.vcs);

  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'VULNERABILITY', // Changed from 'SECRET' to 'VULNERABILITY'
      active: false,
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
          repos: selectedRepos?.map((repo) => repo.id),
          vcs: selectedVCs?.map((vc) => vc.id),
        };

        await updateAllowList(payload);
        toast.success('SCA allow list updated successfully');
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error('Failed to update SCA allow list');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const updateAllowList = async (payload: any) => {
    const endpoint = API_ENDPOINTS.allowList.updateAllowList;
    const api = createEndpointUrl(endpoint);

    return new Promise((resolve, reject) => {
      commonAPIRequest(
        {
          api: api + allowList.id,
          method: endpoint.method,
          data: { ...payload, id: allowList.id },
        },
        (response) => {
          if (response) {
            resolve(response);
          } else {
            reject(new Error('Failed to update allow list'));
          }
        }
      );
    });
  };

  // Set initial values when allowList changes
  React.useEffect(() => {
    if (allowList) {
      formik.setFieldValue('name', allowList.name);
      formik.setFieldValue('active', allowList.active);
      formik.setFieldValue('global_', allowList.global_);
      formik.setFieldValue(
        'repos',
        allowList.repos?.map((r) => r.id)
      );
      formik.setFieldValue(
        'vcs',
        allowList.vcs?.map((v) => v.id)
      );
      setSelectedRepos(allowList.repos);
      setSelectedVCs(allowList.vcs);
    }
  }, [allowList]);

  // console.log('allowlist0---->', allowList);

  React.useEffect(() => {
    formik.setFieldValue(
      'repos',
      selectedRepos?.map((repo) => repo.id)
    );
  }, [selectedRepos]);

  React.useEffect(() => {
    formik.setFieldValue(
      'vcs',
      selectedVCs?.map((vc) => vc.id)
    );
  }, [selectedVCs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 
          dark:from-emerald-600/20 dark:to-blue-600/20 
          border-b border-emerald-100 dark:border-emerald-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>Edit SCA Allow List</DialogTitle>
              <DialogDescription>
                Update your SCA allow list settings and configurations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter name"
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
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400'
                    : 'border-gray-200 hover:border-emerald-200 dark:border-gray-700 dark:hover:border-emerald-700'
                }`}
              >
                <div className="absolute right-4 top-4">
                  <Checkbox
                    id="active"
                    name="active"
                    checked={formik.values.active}
                    onCheckedChange={(checked) => formik.setFieldValue('active', checked)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                </div>
                <Label
                  htmlFor="active"
                  className="block h-full w-full cursor-pointer"
                  onClick={() => formik.setFieldValue('active', !formik.values.active)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-md ${
                          formik.values.active
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
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
                    onCheckedChange={(checked) => formik.setFieldValue('global_', checked)}
                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                </div>
                <Label
                  htmlFor="global_"
                  className="block h-full w-full cursor-pointer"
                  onClick={() => formik.setFieldValue('global_', !formik.values.global_)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-md ${
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
                placeholder="Add a comment about these changes..."
                className="min-h-[100px] resize-none"
              />
              {formik.touched.comment && formik.errors.comment && (
                <p className="text-xs text-red-500">{formik.errors.comment}</p>
              )}
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button" // Changed from 'submit' to 'button'
                onClick={() => formik.handleSubmit()} // Explicitly handle submission
                disabled={formik.isSubmitting}
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 dark:from-emerald-600 dark:to-blue-600 dark:hover:from-emerald-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
              >
                {formik.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Allow List'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EditScaAllowListDialog);
