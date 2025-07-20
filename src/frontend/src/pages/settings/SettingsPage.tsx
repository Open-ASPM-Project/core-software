import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Users, KeyRound, Bell } from 'lucide-react';
import AlertsTab from './tabs/alerts/AlertsTab';
import ConfigurationTab from './tabs/version-control/ConfigurationTab';
import SSOConfigTab from './tabs/sso-configs/SSOConfigTab';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserManagementTab from './tabs/user-management/UserManagementTab';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'configuration';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  React.useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'configuration' });
    }
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/secret/dashboard')}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Manage your system settings and configurations.</p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="sso" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              SSO Config
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <ConfigurationTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="sso">
            <SSOConfigTab />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
