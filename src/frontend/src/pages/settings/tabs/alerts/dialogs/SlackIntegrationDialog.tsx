import React from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export const slackIntegrationSchema = Yup.object().shape({
  token: Yup.string().required('Token is required').min(3, 'Token must be at least 3 characters'),
  channel: Yup.string().required('Channel name is required').min(1, 'Channel name is required'),
  notifyOnCritical: Yup.boolean().default(true),
  notifyOnWarning: Yup.boolean().default(true),
  active: Yup.boolean(),
});

export type SlackConfigType = Yup.InferType<typeof slackIntegrationSchema>;

interface SlackIntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SlackConfigType) => void;
  currentConfig?: {
    token: string;
    channel: string;
    notifyOnCritical: boolean;
    notifyOnWarning: boolean;
    active?: boolean;
  };
  updateConfig?: (data: SlackConfigType) => void;
  addConfig?: (data: SlackConfigType) => void;
}

const SlackIntegrationDialog: React.FC<SlackIntegrationDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  updateConfig,
  addConfig,
}) => {
  const [showToken, setShowToken] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      token: '',
      channel: '',
      notifyOnCritical: true,
      notifyOnWarning: true,
    },
    validationSchema: slackIntegrationSchema,
    onSubmit: (values, { setSubmitting }) => {
      handleSubmit({ ...values, active: true });
      setSubmitting(false);
    },
  });

  const handleSubmit = (values: SlackConfigType) => {
    if (currentConfig && updateConfig) {
      updateConfig(values);
    } else if (addConfig) {
      addConfig(values);
    }
    onSave(values);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen && currentConfig) {
      formik.setFieldValue('token', currentConfig.token);
      formik.setFieldValue('channel', currentConfig.channel);
    }
  }, [currentConfig, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 
            dark:from-violet-600/20 dark:to-blue-600/20 
            border-b border-violet-100 dark:border-violet-800/30"
        >
          <DialogTitle>
            {currentConfig ? 'Update Slack Integration' : 'Configure Slack Integration'}
          </DialogTitle>
          <DialogDescription className="text-violet-700/70 dark:text-violet-300/70">
            Set up Slack notifications for your alerts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <div className="relative">
              <Input
                id="token"
                name="token"
                placeholder="Enter your Slack token"
                type={showToken ? 'text' : 'password'}
                value={formik.values.token}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formik.touched.token && formik.errors.token && (
              <p className="text-xs font-medium text-red-500">{formik.errors.token}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Channel</Label>
            <Input
              id="channel"
              name="channel"
              placeholder="alerts"
              value={formik.values.channel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.channel && formik.errors.channel && (
              <p className="text-xs font-medium text-red-500">{formik.errors.channel}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label>Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on critical issues</p>
              </div>
              <Switch
                name="notifyOnCritical"
                checked={formik.values.notifyOnCritical}
                onCheckedChange={(checked) => {
                  formik.setFieldValue('notifyOnCritical', checked);
                }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <Label>Warning Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on warnings</p>
              </div>
              <Switch
                name="notifyOnWarning"
                checked={formik.values.notifyOnWarning}
                onCheckedChange={(checked) => {
                  formik.setFieldValue('notifyOnWarning', checked);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formik.isSubmitting}
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg h-11"
            >
              {formik.isSubmitting ? 'Saving...' : currentConfig ? 'Update' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SlackIntegrationDialog;
