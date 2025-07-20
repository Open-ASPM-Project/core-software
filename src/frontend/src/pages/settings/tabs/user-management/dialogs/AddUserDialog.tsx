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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface AddUserDialogProps {
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

interface UserData {
  username: string;
  role: 'admin' | 'user' | 'readonly';
  user_email: string;
  active: boolean;
  password: string;
}

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters.')
    .required('Username is required'),
  user_email: Yup.string()
    .email('Please enter a valid email address.')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['admin', 'user', 'readonly'], 'Please select a valid role')
    .required('Please select a role'),
  active: Yup.boolean().required('Status is required'),
});

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onSuccess, commonAPIRequest }) => {
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const addUser = React.useCallback(
    async (
      data: UserData,
      callbacks: { onSuccess: () => void; onComplete: () => void }
    ): Promise<void> => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.users.createUser;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
          data: {
            username: data.username,
            role: data.role,
            user_email: data.user_email,
            active: data.active,
            password: data.password,
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
      username: '',
      user_email: '',
      password: '',
      role: 'user' as const,
      active: true,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      await addUser(values, {
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
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <UserPlus className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account.</DialogDescription>
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={
                      formik.touched.password && formik.errors.password
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
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs font-medium text-red-500">{formik.errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
              </div>
            </div>

            <div className="grid gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  onValueChange={(value) => formik.setFieldValue('role', value)}
                  defaultValue={formik.values.role}
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
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddUserDialog);
