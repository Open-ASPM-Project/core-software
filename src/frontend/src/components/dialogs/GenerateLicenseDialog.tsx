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
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { toast } from 'sonner';

const licenseEmailSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  // otp: Yup.string().required('OTP is required').length(6, 'OTP must be 6 digits'),
});

const GenerateLicenseDialog: React.FC<LicenseExpiredDialogProps> = ({
  isOpen,
  onClose,
  commonAPIRequest,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [licenseID, setLicenseID] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      otp: '',
    },
    validationSchema: licenseEmailSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSubmitting(true);

      console.log('jzdfghsdhjfg');

      // Check if the license ID is not set, then request new license
      if (!licenseID) {
        const endpoint = API_ENDPOINTS.auth.requestLicense;
        const apiUrl = createEndpointUrl(endpoint);

        commonAPIRequest(
          {
            api: apiUrl,
            method: endpoint.method,
            data: { email: values.email },
          },
          (response: any) => {
            if (response && response.id) {
              setLicenseID(response.id);
              setError(null);
            } else {
              setError('Failed to submit license request. Please try again.');
            }
            setSubmitting(false);
          }
        );
      } else {
        // If license ID is set, validate the OTP
        const endpoint = API_ENDPOINTS.auth.licenseValidateOTP;
        const apiUrl = createEndpointUrl(endpoint);

        commonAPIRequest(
          {
            api: apiUrl,
            method: endpoint.method,
            data: { license_id: licenseID, otp: values.otp },
          },
          (response: any) => {
            if (response && response.data) {
              onClose(); // or any other success action
              toast.success(response?.message);
              setError('OTP validation failed. Please try again.');
            }
            setSubmitting(false);
          }
        );
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-0 gap-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-600/20 dark:to-orange-600/20 border-b border-red-100 dark:border-red-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-red-900 dark:text-red-100">License Expired</DialogTitle>
              <DialogDescription className="text-red-700/70 dark:text-red-300/70">
                Your license has expired. Please enter your email to request a new license.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              disabled={formik.isSubmitting || licenseID !== null}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-500">{formik.errors.email}</p>
            )}
          </div>

          {licenseID && (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                placeholder="Enter OTP"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.otp}
                disabled={formik.isSubmitting}
              />
              {formik.touched.otp && formik.errors.otp && (
                <p className="text-xs text-red-500">{formik.errors.otp}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500"
            >
              {formik.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : licenseID ? (
                'Validate OTP'
              ) : (
                'Request New License'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(GenerateLicenseDialog);
