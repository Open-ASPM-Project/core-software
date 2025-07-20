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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserCog, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { toast } from 'sonner';

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: number;
    username: string;
    user_email: string;
    role: 'admin' | 'user' | 'readonly';
    active: boolean;
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

interface UpdateUserData {
  username: string;
  role: 'admin' | 'user' | 'readonly';
  user_email: string;
  active: boolean;
}

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters.')
    .required('Username is required'),
  user_email: Yup.string()
    .email('Please enter a valid email address.')
    .required('Email is required'),
  role: Yup.string()
    .oneOf(['admin', 'user', 'readonly'], 'Please select a valid role')
    .required('Please select a role'),
  active: Yup.boolean().required('Status is required'),
});

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  commonAPIRequest,
}) => {
  const updateUser = React.useCallback(
    async (
      userId: number,
      data: UpdateUserData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.users.updateUser;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: `${apiUrl}${userId}`,
          method: endpoint.method,
          data: {
            username: data.username,
            role: data.role,
            user_email: data.user_email,
            active: data.active,
          },
        },
        (response) => {
          if (response) {
            callbacks.onSuccess();
            toast.success('User updated successfully');
          } else {
            toast.error('Failed to update user');
          }
          callbacks.onComplete();
        }
      );
    },
    [commonAPIRequest]
  );

  const formik = useFormik({
    initialValues: {
      username: '',
      user_email: '',
      role: 'user' as const,
      active: true,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      await updateUser(user.id, values, {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
        onComplete: () => {
          setSubmitting(false);
        },
      });
    },
  });

  // Set form values when dialog opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      formik.setFieldValue('username', user.username);
      formik.setFieldValue('user_email', user.user_email);
      formik.setFieldValue('role', user.role);
      formik.setFieldValue('active', user.active);
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <UserCog className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user account settings.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6 p-6 pt-0">
          <div className="grid gap-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="john.doe"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.username && formik.errors.username && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formik.values.user_email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.user_email && formik.errors.user_email && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.user_email}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  onValueChange={(value) => formik.setFieldValue('role', value)}
                  value={formik.values.role}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Security Analyst</SelectItem>
                    <SelectItem value="readonly">Developer</SelectItem>
                  </SelectContent>
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.role}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-4 p-3 rounded-md border">
                  <RadioGroup
                    name="active"
                    value={formik.values.active ? 'true' : 'false'}
                    onValueChange={(value) => formik.setFieldValue('active', value === 'true')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="active" />
                      <Label htmlFor="active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="inactive" />
                      <Label htmlFor="inactive">Inactive</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
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
                'Update User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(EditUserDialog);
