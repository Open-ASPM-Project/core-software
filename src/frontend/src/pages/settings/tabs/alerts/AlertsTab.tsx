import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SlackIntegration from './integrations/SlackIntegration';
import JiraIntegration from './integrations/JiraIntegration';

type IntegrationType = 'slack' | 'jira';

export interface IntegrationStatus {
  configured: boolean;
  enabled: boolean;
  lastSync?: string;
  status: 'success' | 'error' | 'warning' | 'not_configured';
}

const AlertsTab = () => {
  const [integrationStatuses, setIntegrationStatuses] = useState<
    Record<IntegrationType, IntegrationStatus>
  >({
    slack: {
      configured: true,
      enabled: true,
      lastSync: '2 minutes ago',
      status: 'success',
    },
    jira: {
      configured: false,
      enabled: false,
      status: 'not_configured',
    },
  });

  const handleIntegrationToggle = (type: IntegrationType) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled,
      },
    }));
  };

  const handleConfigure = (type: IntegrationType) => {
    setIntegrationStatuses((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        configured: true,
        status: 'success',
        lastSync: 'Just now',
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert Integrations</CardTitle>
          <CardDescription>
            Configure how you want to receive alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SlackIntegration
            status={integrationStatuses.slack}
            onToggle={() => handleIntegrationToggle('slack')}
            onConfigureClick={() => handleConfigure('slack')}
          />
          <JiraIntegration
            status={integrationStatuses.jira}
            onToggle={() => handleIntegrationToggle('jira')}
            onConfigureClick={() => handleConfigure('jira')}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsTab;
