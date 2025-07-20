import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(2, 'Password must be at least 2 characters')
    // .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    // .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    // .matches(/[0-9]/, 'Must contain at least one number')
    // .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  isOpen,
  onClose,
  commonAPIRequest,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!commonAPIRequest) return;

      setError(null);
      setSubmitting(true);

      const endpoint = API_ENDPOINTS.auth.resetPassword;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
          data: {
            new_password: values.newPassword,
          },
        },
        (response: any) => {
          setSubmitting(false);
          if (response) {
            onClose();
          } else {
            setError(response?.message || 'Failed to reset password. Please try again.');
          }
        }
      );
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="mx-auto p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2">
            <KeyRound className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <DialogTitle className="text-center text-violet-900 dark:text-violet-100">
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-center text-violet-700/70 dark:text-violet-300/70">
            Please enter your new password below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className={`pr-10 ${
                  formik.touched.newPassword && formik.errors.newPassword ? 'border-red-500' : ''
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.newPassword}
                disabled={formik.isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formik.touched.newPassword && formik.errors.newPassword && (
              <p className="text-xs text-red-500">{formik.errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className={`pr-10 ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? 'border-red-500'
                    : ''
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={formik.isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-xs text-red-500">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(ResetPasswordDialog);
