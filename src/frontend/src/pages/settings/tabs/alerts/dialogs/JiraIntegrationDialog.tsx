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
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export const jiraIntegrationSchema = Yup.object().shape({
  domain: Yup.string().url('Please enter a valid Jira domain').required('Domain is required'),
  apiToken: Yup.string().required('API token is required'),
  projectKey: Yup.string().required('Project key is required'),
  userEmail: Yup.string().email('Please enter a valid email').required('User email is required'),
  is_active: Yup.boolean(),
});

export type JiraConfigType = Yup.InferType<typeof jiraIntegrationSchema>;

interface JiraIntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: JiraConfigType) => void;
  currentConfig?: JiraConfigType;
  updateConfig?: (data: JiraConfigType) => void;
  addConfig?: (data: JiraConfigType) => void;
}

const JiraIntegrationDialog: React.FC<JiraIntegrationDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  updateConfig,
  addConfig,
}) => {
  const [showApiToken, setShowApiToken] = React.useState(false);

  const formik = useFormik({
    initialValues: currentConfig || {
      domain: '',
      apiToken: '',
      projectKey: '',
      userEmail: '',
      is_active: true,
    },
    validationSchema: jiraIntegrationSchema,
    onSubmit: (values, { setSubmitting }) => {
      handleSubmit(values);
      setSubmitting(false);
    },
  });

  const handleSubmit = (values: JiraConfigType) => {
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
      formik.setFieldValue('domain', currentConfig.domain);
      formik.setFieldValue('apiToken', currentConfig.apiToken);
      formik.setFieldValue('projectKey', currentConfig.projectKey);
      formik.setFieldValue('userEmail', currentConfig.userEmail);
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
            {currentConfig ? 'Update Jira Integration' : 'Configure Jira Integration'}
          </DialogTitle>
          <DialogDescription className="text-violet-700/70 dark:text-violet-300/70">
            Connect with Jira to create issues from alerts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="domain">Jira Domain</Label>
            <Input
              id="domain"
              name="domain"
              placeholder="https://your-domain.atlassian.net"
              value={formik.values.domain}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.domain && formik.errors.domain && (
              <p className="text-xs font-medium text-red-500 m-0">{formik.errors.domain}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token</Label>
            <div className="relative">
              <Input
                id="apiToken"
                name="apiToken"
                type={showApiToken ? 'text' : 'password'}
                value={formik.values.apiToken}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiToken(!showApiToken)}
              >
                {showApiToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formik.touched.apiToken && formik.errors.apiToken && (
              <p className="text-xs font-medium text-red-500">{formik.errors.apiToken}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectKey">Project Key</Label>
            <Input
              id="projectKey"
              name="projectKey"
              placeholder="PROJ"
              value={formik.values.projectKey}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.projectKey && formik.errors.projectKey && (
              <p className="text-xs font-medium text-red-500">{formik.errors.projectKey}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">User Email</Label>
            <Input
              id="userEmail"
              name="userEmail"
              placeholder="user@example.com"
              type="email"
              value={formik.values.userEmail}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.userEmail && formik.errors.userEmail && (
              <p className="text-xs font-medium text-red-500">{formik.errors.userEmail}</p>
            )}
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

export default JiraIntegrationDialog;
