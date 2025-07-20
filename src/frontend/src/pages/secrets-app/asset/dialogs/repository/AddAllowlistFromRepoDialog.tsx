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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Shield } from 'lucide-react';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { toast } from 'sonner';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Textarea } from '@/components/ui/textarea';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface AddAllowlistFromRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  repository: Repository; // Pre-selected repository
  type: string;
}

interface Repository {
  id: number;
  name: string;
}

const validationSchema = yup.object().shape({
  active: yup.boolean(),
  comment: yup.string().max(500, 'Comment must not exceed 500 characters'),
});

const AddAllowlistFromRepoDialog: React.FC<AddAllowlistFromRepoDialogProps> = ({
  open,
  onOpenChange,
  commonAPIRequest,
  onSuccess,
  repository,
  type,
}) => {
  const formik = useFormik({
    initialValues: {
      type: type,
      active: true,
      repos: [repository.id], // Initialize with the pre-selected repository
      comment: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          repos: [repository.id], // Ensure repository ID is included
        };

        await createAllowList(payload);

        toast.success('Allow list added successfully');
        onOpenChange(false);
        onSuccess();
        handleFormReset();
      } catch (error) {
        toast.error('Failed to create allow list');
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 
          dark:from-emerald-600/20 dark:to-blue-600/20 
          border-b border-emerald-100 dark:border-emerald-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>Add New Allow List</DialogTitle>
              <DialogDescription>
                Create a new allow list for repository: {repository.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6">
          <form onSubmit={formik.handleSubmit} className="space-y-4">
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
                  onCheckedChange={(checked) => {
                    if (checked !== formik.values.active) {
                      formik.setFieldValue('active', checked);
                    }
                  }}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
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

            <div className="space-y-2">
              <SelectRepo
                label="Repository"
                selectedValues={[repository]}
                onSelectedChange={() => {}} // No-op since selection is disabled
                disabled={true} // Disable repository selection
              />
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
                  formik.resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formik.isSubmitting}
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 dark:from-emerald-600 dark:to-blue-600 dark:hover:from-emerald-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium"
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

export default withAPIRequest(AddAllowlistFromRepoDialog);
