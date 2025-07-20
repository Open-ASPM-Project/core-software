import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, CheckCircle2, AlertTriangle, XCircle, Link } from 'lucide-react';
import SlackIntegrationDialog from '../dialogs/SlackIntegrationDialog';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import type { SlackConfigType } from '../dialogs/SlackIntegrationDialog';

interface SlackIntegrationProps {
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

interface SlackConfig {
  token: string;
  channel: string;
  active: boolean;
  notifyOnCritical?: boolean;
  notifyOnWarning?: boolean;
  lastSync?: string;
}

export const slackIntegrationConfig = {
  type: 'slack' as const,
  title: 'Slack',
  description: 'Send alerts to Slack channels',
  iconUrl: 'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/306_Slack_logo-512.png',
};

type StatusType = 'success' | 'error' | 'warning' | 'not_configured';

interface StatusConfig {
  icon: React.ComponentType;
  className: string;
  text: string;
  badge: string;
}

const getStatusConfig = (status: StatusType): StatusConfig => {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle2,
        className: 'text-green-500',
        text: 'Connected',
        badge: 'bg-green-500/15 text-green-700 dark:text-green-400',
      };
    case 'error':
      return {
        icon: XCircle,
        className: 'text-red-500',
        text: 'Error',
        badge: 'bg-red-500/15 text-red-700 dark:text-red-400',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        className: 'text-yellow-500',
        text: 'Warning',
        badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      };
    default:
      return {
        icon: Link,
        className: 'text-gray-500',
        text: 'Not Configured',
        badge: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
      };
  }
};

const SlackIntegration: React.FC<SlackIntegrationProps> = ({ commonAPIRequest }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [slackConfig, setSlackConfig] = useState<SlackConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusType>('not_configured');

  const fetchSlackConfig = () => {
    if (!commonAPIRequest) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.integrations.getSlackConfig;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<SlackConfig>(
      {
        api: apiUrl,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setSlackConfig(response);
          setStatus('success');
        } else {
          setStatus('not_configured');
        }
      }
    );
  };

  const updateSlackConfig = (data: SlackConfig) => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.integrations.updateSlackConfig;
    const apiUrl = createEndpointUrl(endpoint);

    setIsLoading(true);
    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        data: {
          token: data.token,
          channel: data.channel,
          active: data.active,
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          fetchSlackConfig();
          setIsDialogOpen(false);
        } else {
          setStatus('error');
        }
      }
    );
  };

  const addSlackConfig = (data: SlackConfig) => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.integrations.addSlackConfig;
    const apiUrl = createEndpointUrl(endpoint);

    setIsLoading(true);
    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        data: {
          token: data.token,
          channel: data.channel,
          active: data.active,
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          fetchSlackConfig();
          setIsDialogOpen(false);
        } else {
          setStatus('error');
        }
      }
    );
  };

  const handleToggle = () => {
    if (!slackConfig) return;

    updateSlackConfig({
      ...slackConfig,
      active: !slackConfig.active,
    });
  };

  useEffect(() => {
    fetchSlackConfig();
  }, []);

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const isConfigured = status !== 'not_configured';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-background ${isConfigured ? '' : 'opacity-50'}`}>
          <img
            src={slackIntegrationConfig.iconUrl}
            alt={slackIntegrationConfig.title}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{slackIntegrationConfig.title}</h4>
            <Badge variant="secondary" className={statusConfig.badge}>
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.text}</span>
              </div>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{slackIntegrationConfig.description}</p>
          {slackConfig?.lastSync && (
            <p className="text-xs text-muted-foreground">Last synced: {slackConfig.lastSync}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch
          checked={slackConfig?.active || false}
          disabled={!isConfigured || isLoading}
          onCheckedChange={handleToggle}
        />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
          disabled={isLoading}
        >
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </div>

      <SlackIntegrationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={fetchSlackConfig}
        updateConfig={(data: SlackConfigType) => updateSlackConfig(data)}
        addConfig={(data: SlackConfigType) => addSlackConfig(data)}
        currentConfig={
          slackConfig
            ? {
                token: slackConfig.token,
                channel: slackConfig.channel,
                notifyOnCritical: true,
                notifyOnWarning: true,
                active: slackConfig.active,
              }
            : undefined
        }
      />
    </div>
  );
};

export default withAPIRequest(SlackIntegration);
