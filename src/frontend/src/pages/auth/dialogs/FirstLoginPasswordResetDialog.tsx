import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, LockKeyhole, AlertCircle, EyeOff, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';

interface FirstLoginPasswordResetDialogProps {
  isOpen: boolean;
  onPasswordReset: () => void;
  commonAPIRequest?: <T>(params: any, callback: (response: T | null) => void) => void;
}

const passwordResetSchema = Yup.object().shape({
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

const FirstLoginPasswordResetDialog: React.FC<FirstLoginPasswordResetDialogProps> = ({
  isOpen,
  onPasswordReset,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordResetSchema,
    onSubmit: (values) => {
      setIsLoading(true);
      setError(null);

      const resetEndpoint = API_ENDPOINTS.auth.resetPasswordFirstLogin;
      const serviceParams = {
        api: `${createEndpointUrl(resetEndpoint)}?new_password=${values.newPassword}`,
        method: resetEndpoint.method,
        // param: {
        //   new_password: values.newPassword,
        // },
      };

      commonAPIRequest(serviceParams, (response: any) => {
        setIsLoading(false);
        if (response) {
          onPasswordReset();
        } else {
          setError(response?.message || 'Failed to reset password. Please try again.');
        }
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <LockKeyhole className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <DialogTitle className="text-center">Set Your Password</DialogTitle>
          <DialogDescription className="text-center">
            This appears to be your first login. Please set a new password to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
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
                className={`pr-10 ${formik.touched.newPassword && formik.errors.newPassword ? 'border-red-500' : ''}`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.newPassword}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
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
                className={`pr-10 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : ''}`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-xs text-red-500">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(FirstLoginPasswordResetDialog);
