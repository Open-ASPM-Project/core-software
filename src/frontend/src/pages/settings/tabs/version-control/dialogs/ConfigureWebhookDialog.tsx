import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Webhook, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { API_BASE_URLS, API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const GIT_ACTIONS = [
  {
    value: 'pr_opened',
    label: 'PR Opened',
  },
  {
    value: 'pr_updated',
    label: 'PR Updated',
  },
  {
    value: 'commit_push',
    label: 'Commit Pushed',
  },
  {
    value: 'repo_push',
    label: 'Repo Push',
  },
];

interface WebhookConfig {
  vc_id: number;
  vc_type: 'github' | 'gitlab' | 'bitbucket';
  scan_type: 'Loose' | 'Aggressive';
  git_actions: string[];
  target_repos: string[];
  block_message: string;
  unblock_message: string;
  active: boolean;
  block_pr_on_sec_found: boolean;
  block_pr_on_vul_found: boolean;
  jira_alerts_enabled: boolean;
  slack_alerts_enabled: boolean;
}

interface ConfigureWebhookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vcsId: number;
  vcsType: 'github' | 'gitlab' | 'bitbucket';
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

const validationSchema = Yup.object({
  scan_type: Yup.string().oneOf(['Loose', 'Aggressive']).required('Scan type is required'),
  git_actions: Yup.array().of(Yup.string()).min(1, 'Select at least one git action'),
  block_message: Yup.string().required('Block message is required'),
  unblock_message: Yup.string().required('Unblock message is required'),
  active: Yup.boolean(),
  block_pr_on_sec_found: Yup.boolean(),
  block_pr_on_vul_found: Yup.boolean(),
  jira_alerts_enabled: Yup.boolean(),
  slack_alerts_enabled: Yup.boolean(),
});

const ConfigureWebhookDialog: React.FC<ConfigureWebhookDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vcsId,
  vcsType,
  commonAPIRequest,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [existingWebhook, setExistingWebhook] = useState<WebhookConfig | null>(null);

  const getActionsByVcsType = () => GIT_ACTIONS;

  const formik = useFormik({
    initialValues: {
      vc_id: vcsId,
      vc_type: vcsType,
      scan_type: 'Loose' as const,
      git_actions: [] as string[],
      target_repos: ['All'],
      block_message: 'Pull request blocked due to security concerns',
      unblock_message: 'Security concerns resolved',
      active: true,
      block_pr_on_sec_found: true,
      block_pr_on_vul_found: false,
      jira_alerts_enabled: false,
      slack_alerts_enabled: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (existingWebhook) {
          await updateWebhookConfig(values);
        } else {
          await createWebhookConfig(values);
        }
        onClose();
        onSuccess?.();
      } catch (error) {
        console.error('Error saving webhook:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const createWebhookConfig = React.useCallback(
    async (data: WebhookConfig): Promise<void> => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.vcs.createWebhook;
      const apiUrl = createEndpointUrl(endpoint);

      return new Promise((resolve, reject) => {
        commonAPIRequest(
          {
            api: `${apiUrl}`,
            method: 'POST',
            data: {
              vc_id: data.vc_id,
              vc_type: data.vc_type,
              scan_type: data.scan_type,
              git_actions: data.git_actions,
              target_repos: data.target_repos,
              block_message: data.block_message,
              unblock_message: data.unblock_message,
              active: data.active,
              block_pr_on_sec_found: data.block_pr_on_sec_found,
              block_pr_on_vul_found: data.block_pr_on_vul_found,
              jira_alerts_enabled: data.jira_alerts_enabled,
              slack_alerts_enabled: data.slack_alerts_enabled,
            },
          },
          (response) => {
            if (response) {
              resolve();
            } else {
              reject(new Error('Failed to create webhook configuration'));
            }
          }
        );
      });
    },
    [commonAPIRequest, vcsId]
  );

  const updateWebhookConfig = React.useCallback(
    async (data: WebhookConfig): Promise<void> => {
      if (!commonAPIRequest || !existingWebhook?.vc_id) return;

      const endpoint = API_ENDPOINTS.vcs.updateWebhook;
      const apiUrl = createEndpointUrl(endpoint);

      return new Promise((resolve, reject) => {
        commonAPIRequest(
          {
            api: `${apiUrl}${vcsId}`,
            method: 'PUT',
            data: {
              vc_id: data.vc_id,
              vc_type: data.vc_type,
              scan_type: data.scan_type,
              git_actions: data.git_actions,
              target_repos: data.target_repos,
              block_message: data.block_message,
              unblock_message: data.unblock_message,
              active: data.active,
              block_pr_on_sec_found: data.block_pr_on_sec_found,
              block_pr_on_vul_found: data.block_pr_on_vul_found,
              jira_alerts_enabled: data.jira_alerts_enabled,
              slack_alerts_enabled: data.slack_alerts_enabled,
            },
          },
          (response) => {
            if (response) {
              resolve();
            } else {
              reject(new Error('Failed to update webhook configuration'));
            }
          }
        );
      });
    },
    [commonAPIRequest, vcsId, existingWebhook]
  );

  useEffect(() => {
    if (isOpen && commonAPIRequest) {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS.vcs.getWebhookConfig;
      const apiUrl = createEndpointUrl(endpoint);

      commonAPIRequest(
        {
          api: `${apiUrl}${vcsId}`,
          method: 'GET',
        },
        (response: WebhookConfig | null) => {
          setIsLoading(false);
          if (response) {
            setExistingWebhook(response);
            formik.setValues(response);
            formik.setFieldValue('git_actions', response?.git_actions ? response?.git_actions : []);
          }
        }
      );
    }
  }, [isOpen, vcsId, commonAPIRequest]);

  if (isLoading) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-[525px] p-0">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const availableActions = GIT_ACTIONS;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] p-0 max-h-[55vh] flex flex-col">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-600/20 dark:to-blue-600/20 border-b border-violet-100 dark:border-violet-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Webhook className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>{existingWebhook ? 'Edit Webhook' : 'Configure Webhook'}</DialogTitle>
              <DialogDescription>
                {existingWebhook
                  ? 'Update your webhook configuration settings.'
                  : 'Set up a new webhook to receive repository events.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[calc(55vh-12rem)]">
          <form onSubmit={formik.handleSubmit} className="space-y-6 p-6 pt-0">
            <div className="grid gap-4 py-4">
              {formik?.values?.secret && (
                <div className="space-y-2">
                  <Label>Secret</Label>
                  <div className="relative">
                    <Input
                      {...formik.getFieldProps('secret')}
                      placeholder=""
                      disabled
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formik.values.secret);
                        toast.success('Secret copied to clipboard');
                      }}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {formik?.values?.url && (
                <div className="space-y-2">
                  <Label>Webhook Url</Label>
                  <div className="relative">
                    <Input
                      value={`${API_BASE_URLS.development}${formik.values.url}`}
                      placeholder=""
                      disabled
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${API_BASE_URLS.development}${formik.values.url}`
                        );
                        toast.success('URL copied to clipboard');
                      }}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Scan Type</Label>
                <Select
                  name="scan_type"
                  value={formik.values.scan_type}
                  onValueChange={(value) => formik.setFieldValue('scan_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loose">Loose</SelectItem>
                    <SelectItem value="Aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Git Actions</Label>
                <div className="border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
                  <div className="grid grid-cols-2 gap-4">
                    {availableActions.map((action) => (
                      <div
                        key={action.value}
                        className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm"
                      >
                        <Checkbox
                          id={action.value}
                          checked={formik.values?.git_actions?.includes(action.value)}
                          onCheckedChange={(checked) => {
                            const newActions = checked
                              ? [...formik.values.git_actions, action.value]
                              : formik.values?.git_actions?.filter((a) => a !== action.value);
                            formik.setFieldValue('git_actions', newActions);
                          }}
                        />
                        <Label
                          htmlFor={action.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {action.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formik.touched.git_actions && formik.errors.git_actions && (
                    <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formik.errors.git_actions}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Block Message</Label>
                <Input
                  {...formik.getFieldProps('block_message')}
                  placeholder="Enter block message"
                />
              </div>
              <div className="space-y-2">
                <Label>Unblock Message</Label>
                <Input
                  {...formik.getFieldProps('unblock_message')}
                  placeholder="Enter unblock message"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Active Status</Label>
                  <Switch
                    checked={formik.values.active}
                    onCheckedChange={(checked) => formik.setFieldValue('active', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Block PR on Security Issues</Label>
                  <Switch
                    checked={formik.values.block_pr_on_sec_found}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue('block_pr_on_sec_found', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Block PR on Vulnerabilities</Label>
                  <Switch
                    checked={formik.values.block_pr_on_vul_found}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue('block_pr_on_vul_found', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Jira Alerts</Label>
                  <Switch
                    checked={formik.values.jira_alerts_enabled}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue('jira_alerts_enabled', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Slack Alerts</Label>
                  <Switch
                    checked={formik.values.slack_alerts_enabled}
                    onCheckedChange={(checked) =>
                      formik.setFieldValue('slack_alerts_enabled', checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
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
                      {existingWebhook ? 'Updating...' : 'Creating...'}
                    </>
                  ) : existingWebhook ? (
                    'Update Webhook'
                  ) : (
                    'Create Webhook'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(ConfigureWebhookDialog);
