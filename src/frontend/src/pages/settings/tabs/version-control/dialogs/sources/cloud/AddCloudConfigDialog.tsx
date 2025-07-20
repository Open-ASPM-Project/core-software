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
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Eye, EyeOff, Cloud } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { withAPIRequest } from '@/hoc/withApiRequest';

interface CloudProvider {
  cloud_type: string;
  label: string;
}

type CloudType =
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'do'
  | 'scw'
  | 'arvancloud'
  | 'cloudflare'
  | 'heroku'
  | 'fastly'
  | 'linode'
  | 'namecheap'
  | 'alibaba'
  | 'terraform'
  | 'consul'
  | 'nomad'
  | 'hetzner'
  | 'kubernetes'
  | 'dnssimple'
  | '';

type CloudConfig =
  | { cloudType: 'aws'; aws: { awsAccessKey: string; awsSecretKey: string } }
  | { cloudType: 'gcp'; gcp: { gcpServiceAccountKey: string } }
  | {
      cloudType: 'azure';
      azure: { clientId: string; clientSecret: string; tenantId: string; subscriptionId: string };
    }
  | { cloudType: 'do'; do: { digitaloceanToken: string } }
  | { cloudType: 'scw'; scw: { scalewayAccessKey: string; scalewayAccessToken: string } }
  | { cloudType: 'arvancloud'; arvancloud: { apiKey: string } }
  | { cloudType: 'cloudflare'; cloudflare: { email: string; apiKey: string } }
  | { cloudType: 'heroku'; heroku: { herokuApiToken: string } }
  | { cloudType: 'fastly'; fastly: { fastlyApiKey: string } }
  | { cloudType: 'linode'; linode: { linodePersonalAccessToken: string } }
  | { cloudType: 'namecheap'; namecheap: { namecheapApiKey: string; namecheapUserName: string } }
  | {
      cloudType: 'alibaba';
      alibaba: {
        alibabaRegionId: string;
        alibabaAccessKey: string;
        alibabaAccessKeySecret: string;
      };
    }
  | { cloudType: 'terraform'; terraform: { tfStateFile: string } }
  | { cloudType: 'consul'; consul: { consulUrl: string } }
  | { cloudType: 'nomad'; nomad: { nomadUrl: string } }
  | { cloudType: 'hetzner'; hetzner: { authToken: string } }
  | { cloudType: 'kubernetes'; kubernetes: { kubeconfigFile: string; kubeconfigEncoded: string } }
  | { cloudType: 'dnssimple'; dnssimple: { dnssimpleApiToken: string } }
  | { cloudType: '' };

interface CloudConfigData extends Record<string, unknown> {
  type: string;
  name: string;
  active: boolean;
  cloud: CloudConfig;
}

// Field configuration for each cloud type
const cloudFields: Record<string, { label: string; type: string; placeholder: string }[]> = {
  aws: [
    { label: 'AWS Access Key', type: 'text', placeholder: 'Enter AWS Access Key' },
    { label: 'AWS Secret Key', type: 'password', placeholder: 'Enter AWS Secret Key' },
  ],
  gcp: [
    {
      label: 'GCP Service Account Key',
      type: 'text',
      placeholder: 'Enter GCP Service Account Key',
    },
  ],
  azure: [
    { label: 'Client ID', type: 'text', placeholder: 'Enter Azure Client ID' },
    { label: 'Client Secret', type: 'password', placeholder: 'Enter Azure Client Secret' },
    { label: 'Tenant ID', type: 'text', placeholder: 'Enter Azure Tenant ID' },
    { label: 'Subscription ID', type: 'text', placeholder: 'Enter Azure Subscription ID' },
  ],
  do: [
    {
      label: 'DigitalOcean Token',
      type: 'password',
      placeholder: 'Enter DigitalOcean Token',
    },
  ],
  scw: [
    { label: 'Scaleway Access Key', type: 'text', placeholder: 'Enter Scaleway Access Key' },
    {
      label: 'Scaleway Access Token',
      type: 'password',
      placeholder: 'Enter Scaleway Access Token',
    },
  ],
  arvancloud: [{ label: 'API Key', type: 'password', placeholder: 'Enter Arvancloud API Key' }],
  cloudflare: [
    { label: 'Email', type: 'email', placeholder: 'Enter Cloudflare Email' },
    { label: 'API Key', type: 'password', placeholder: 'Enter Cloudflare API Key' },
  ],
  heroku: [{ label: 'API Token', type: 'password', placeholder: 'Enter Heroku API Token' }],
  fastly: [{ label: 'API Key', type: 'password', placeholder: 'Enter Fastly API Key' }],
  linode: [
    {
      label: 'Personal Access Token',
      type: 'password',
      placeholder: 'Enter Linode Personal Access Token',
    },
  ],
  namecheap: [
    { label: 'API Key', type: 'password', placeholder: 'Enter Namecheap API Key' },
    { label: 'Username', type: 'text', placeholder: 'Enter Namecheap Username' },
  ],
  alibaba: [
    { label: 'Region ID', type: 'text', placeholder: 'Enter Alibaba Region ID' },
    { label: 'Access Key', type: 'text', placeholder: 'Enter Alibaba Access Key' },
    {
      label: 'Access Key Secret',
      type: 'password',
      placeholder: 'Enter Alibaba Access Key Secret',
    },
  ],
  terraform: [{ label: 'TF State File', type: 'text', placeholder: 'Enter Terraform State File' }],
  consul: [{ label: 'Consul URL', type: 'url', placeholder: 'Enter Consul URL' }],
  nomad: [{ label: 'Nomad URL', type: 'url', placeholder: 'Enter Nomad URL' }],
  hetzner: [{ label: 'Auth Token', type: 'password', placeholder: 'Enter Hetzner Auth Token' }],
  kubernetes: [
    { label: 'Kubeconfig File', type: 'text', placeholder: 'Enter Kubeconfig File' },
    {
      label: 'Kubeconfig Encoded',
      type: 'text',
      placeholder: 'Enter Encoded Kubeconfig',
    },
  ],
  dnssimple: [
    {
      label: 'API Token',
      type: 'password',
      placeholder: 'Enter DNSimple API Token',
    },
  ],
};

interface AddCloudConfigDialogProps {
  onSuccess?: () => void;
}

interface WithAPIRequestProps {
  commonAPIRequest: <T>(
    requestParams: {
      api: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

type Props = AddCloudConfigDialogProps & WithAPIRequestProps;

const AddCloudConfigDialog: React.FC<Props> = ({ onSuccess, commonAPIRequest }) => {
  const [open, setOpen] = React.useState(false);
  const [showSecrets, setShowSecrets] = React.useState(false);
  const [cloudProviders, setCloudProviders] = React.useState<CloudProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = React.useState(true);

  const getInitialValues = (cloudType: CloudType = ''): CloudConfigData => {
    const initialValues: CloudConfigData = {
      type: 'cloud',
      name: '',
      active: true,
      cloud: {
        cloudType,
      } as CloudConfig,
    };

    if (cloudType && cloudFields[cloudType]) {
      const fields = cloudFields[cloudType];
      const cloudConfig: Record<string, string> = {};

      fields.forEach((field) => {
        const key = field.label.toLowerCase().replace(/\s+/g, '');
        cloudConfig[key] = '';
      });

      initialValues.cloud = {
        cloudType,
        [cloudType]: cloudConfig,
      } as CloudConfig;
    }

    return initialValues;
  };

  const formik = useFormik<CloudConfigData>({
    initialValues: getInitialValues(),
    validationSchema: Yup.object({
      type: Yup.string().required(),
      name: Yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
      active: Yup.boolean(),
      cloud: Yup.object({
        cloudType: Yup.string()
          .oneOf(
            cloudProviders.map((provider) => provider.cloud_type as CloudType),
            'Invalid cloud type'
          )
          .required('Cloud type is required'),
      }).required(),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.sources.addCloudSources;
      const apiUrl = createEndpointUrl(endpoint);

      // Create a new object with only the selected cloud type data
      const selectedCloudType = values.cloud.cloudType;
      const cloudData = {
        type: values.type,
        name: values.name,
        active: values.active,
        cloud: {
          cloudType: selectedCloudType,
          [selectedCloudType]: values.cloud[selectedCloudType as keyof typeof values.cloud],
        },
      };

      commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
          data: cloudData,
        },
        (response: unknown) => {
          if (response) {
            setOpen(false);
            resetForm();
            onSuccess?.();
          }
          setSubmitting(false);
        }
      );
    },
  });

  // Update form values when cloud type changes
  React.useEffect(() => {
    if (formik.values.cloud.cloudType) {
      const newValues = getInitialValues(formik.values.cloud.cloudType as CloudType);
      formik.setValues({
        ...newValues,
        name: formik.values.name, // Preserve the name
        active: formik.values.active, // Preserve active state
      });
    }
  }, [formik.values.cloud.cloudType]);

  React.useEffect(() => {
    const fetchCloudProviders = async () => {
      if (!commonAPIRequest) return;

      const endpoint = API_ENDPOINTS.sources.getCloudProviders;
      const apiUrl = createEndpointUrl(endpoint);

      setLoadingProviders(true);
      commonAPIRequest(
        {
          api: apiUrl,
          method: endpoint.method,
        },
        (response: CloudProvider[] | null) => {
          if (response) {
            setCloudProviders(response);
          }
          setLoadingProviders(false);
        }
      );
    };

    if (open) {
      fetchCloudProviders();
    }
  }, [commonAPIRequest, open]);

  const renderCloudFields = () => {
    const cloudType = formik.values.cloud.cloudType as CloudType;
    if (!cloudType || !cloudFields[cloudType]) return null;

    return cloudFields[cloudType].map((field, index) => {
      const fieldName = field.label.toLowerCase().replace(/\s+/g, '');
      const fieldPath = `cloud.${cloudType}.${fieldName}`;
      const touched = formik.touched.cloud as
        | { [key: string]: { [key: string]: boolean } }
        | undefined;
      const errors = formik.errors.cloud as
        | { [key: string]: { [key: string]: string } }
        | undefined;
      const hasError = touched?.[cloudType]?.[fieldName] && errors?.[cloudType]?.[fieldName];

      return (
        <div key={index} className="space-y-2">
          <Label>{field.label}</Label>
          <div className="relative">
            <Input
              type={showSecrets && field.type === 'password' ? 'text' : field.type}
              {...formik.getFieldProps(fieldPath)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500 ring-red-200 placeholder-red-400' : ''}
            />
            {field.type === 'password' && (
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium px-6 py-2.5 rounded-lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Cloud Config
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 rounded-t-lg bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 dark:from-indigo-600/20 dark:to-cyan-600/20 border-b border-indigo-100 dark:border-indigo-800/30">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 ${
                formik.values.cloud.cloudType &&
                cloudFields[formik.values.cloud.cloudType]?.[0]?.type === 'text'
                  ? 'text-orange-500 dark:text-orange-400'
                  : formik.values.cloud.cloudType &&
                      cloudFields[formik.values.cloud.cloudType]?.[0]?.type === 'email'
                    ? 'text-blue-600 dark:text-blue-400'
                    : formik.values.cloud.cloudType &&
                        cloudFields[formik.values.cloud.cloudType]?.[0]?.type === 'password'
                      ? 'text-purple-500 dark:text-purple-400'
                      : 'text-indigo-500 dark:text-indigo-400'
              }`}
            >
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>Add Cloud Configuration</DialogTitle>
              <DialogDescription>Configure your cloud provider settings</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label>Configuration Name</Label>
              <Input {...formik.getFieldProps('name')} placeholder="Enter configuration name" />
              {formik.touched.name && formik.errors.name && (
                <div className="text-sm text-destructive">{formik.errors.name}</div>
              )}
            </div>

            {/* Cloud Provider Select */}
            <div className="space-y-2">
              <Label>Cloud Provider</Label>
              <Select
                name="cloud.cloudType"
                value={formik.values.cloud.cloudType}
                onValueChange={(value) => formik.setFieldValue('cloud.cloudType', value)}
                disabled={loadingProviders}
              >
                <SelectTrigger>
                  {loadingProviders ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading providers...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select a cloud provider" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {cloudProviders.map((provider) => (
                    <SelectItem key={provider.cloud_type} value={provider.cloud_type}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Cloud Fields */}
            {renderCloudFields()}

            {/* Active Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this cloud configuration
                </p>
              </div>
              <Switch
                checked={formik.values.active}
                onCheckedChange={(checked) => formik.setFieldValue('active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={formik.isSubmitting || !formik.isValid}
              className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 dark:from-violet-600 dark:to-blue-600 dark:hover:from-violet-500 dark:hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {formik.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Cloud Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(AddCloudConfigDialog);
