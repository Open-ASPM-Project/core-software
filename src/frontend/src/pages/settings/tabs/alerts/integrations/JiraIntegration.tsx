import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, CheckCircle2, XCircle, Link } from 'lucide-react';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import JiraIntegrationDialog, { JiraConfigType } from '../dialogs/JiraIntegrationDialog';
// import type { JiraConfigType } from '../dialogs/JiraIntegrationDialog';

interface JiraIntegrationProps {
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

interface JiraConfig {
  base_url: string;
  user_email: string;
  api_token: string;
  project_key: string;
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const jiraIntegrationConfig = {
  type: 'jira' as const,
  title: 'Jira Integration',
  description: 'Create Jira issues from alerts',
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968875.png',
};

const getStatusConfig = (isConfigured: boolean, hasError: boolean = false) => {
  if (!isConfigured) {
    return {
      icon: Link,
      className: 'text-gray-500',
      text: 'Not Configured',
      badge: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
    };
  }
  if (hasError) {
    return {
      icon: XCircle,
      className: 'text-red-500',
      text: 'Error',
      badge: 'bg-red-500/15 text-red-700 dark:text-red-400',
    };
  }
  return {
    icon: CheckCircle2,
    className: 'text-green-500',
    text: 'Connected',
    badge: 'bg-green-500/15 text-green-700 dark:text-green-400',
  };
};

const JiraIntegration: React.FC<JiraIntegrationProps> = ({ commonAPIRequest }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJiraConfig = () => {
    if (!commonAPIRequest) return;

    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.integrations.getJiraConfig;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<JiraConfig>(
      {
        api: apiUrl,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setJiraConfig(response);
        }
      }
    );
  };

  const updateJiraConfig = (data: JiraConfigType) => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.integrations.updateJiraConfig;
    const apiUrl = createEndpointUrl(endpoint);

    setIsLoading(true);
    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        data: {
          base_url: data.domain,
          api_token: data.apiToken,
          project_key: data.projectKey,
          user_email: data.userEmail,
          is_active: jiraConfig?.is_active || false,
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          fetchJiraConfig();
          setIsDialogOpen(false);
        }
      }
    );
  };

  const addJiraConfig = (data: JiraConfigType) => {
    if (!commonAPIRequest) return;

    const endpoint = API_ENDPOINTS.integrations.addJiraConfig;
    const apiUrl = createEndpointUrl(endpoint);

    setIsLoading(true);
    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        data: {
          base_url: data.domain,
          api_token: data.apiToken,
          project_key: data.projectKey,
          user_email: data.userEmail,
          is_active: jiraConfig?.is_active || false,
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          fetchJiraConfig();
          setIsDialogOpen(false);
        }
      }
    );
  };

  useEffect(() => {
    fetchJiraConfig();
  }, []);

  const statusConfig = getStatusConfig(!!jiraConfig, !!error);
  const StatusIcon = statusConfig.icon;

  const handleToggle = () => {
    if (!commonAPIRequest || !jiraConfig) return;

    const endpoint = API_ENDPOINTS.integrations.updateJiraConfig;
    const apiUrl = createEndpointUrl(endpoint);

    setIsLoading(true);
    commonAPIRequest(
      {
        api: apiUrl,
        method: endpoint.method,
        data: {
          ...jiraConfig,
          is_active: !jiraConfig.is_active,
        },
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          fetchJiraConfig();
        }
      }
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-background ${jiraConfig ? '' : 'opacity-50'}`}>
          <img
            src={jiraIntegrationConfig.iconUrl}
            alt={jiraIntegrationConfig.title}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{jiraIntegrationConfig.title}</h4>
            <Badge variant="secondary" className={statusConfig.badge}>
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusConfig.text}</span>
              </div>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{jiraIntegrationConfig.description}</p>
          {jiraConfig?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(jiraConfig.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Switch
          checked={jiraConfig?.is_active || false}
          disabled={!jiraConfig || isLoading}
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

      <JiraIntegrationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={fetchJiraConfig}
        updateConfig={(data: JiraConfigType) => updateJiraConfig(data)}
        addConfig={(data: JiraConfigType) => addJiraConfig(data)}
        currentConfig={
          jiraConfig
            ? {
                domain: jiraConfig.base_url,
                apiToken: jiraConfig.api_token,
                projectKey: jiraConfig.project_key,
                userEmail: jiraConfig.user_email,
                is_active: jiraConfig.is_active,
              }
            : undefined
        }
      />
    </div>
  );
};

export default withAPIRequest(JiraIntegration);
