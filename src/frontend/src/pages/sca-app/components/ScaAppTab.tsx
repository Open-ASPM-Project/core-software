import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, BarChart2, Shield, AlertCircle } from 'lucide-react';

interface PreviewCodeTabsProps {
  className?: string;
}

const ScaAppTab = ({ className }: PreviewCodeTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const tabStyle = cn(
    'relative rounded-lg border-0 pb-3 pt-2 font-medium transition-all duration-300',
    'hover:bg-gradient-to-r',
    'data-[state=active]:bg-gradient-to-r',
    'data-[state=active]:font-semibold data-[state=active]:shadow-sm',
    '[&[data-value=dashboard]]:hover:from-amber-50 [&[data-value=dashboard]]:hover:to-orange-50',
    '[&[data-value=dashboard]]:data-[state=active]:from-amber-500/10 [&[data-value=dashboard]]:data-[state=active]:to-orange-500/10',
    '[&[data-value=assets]]:hover:from-violet-50 [&[data-value=assets]]:hover:to-blue-50',
    '[&[data-value=assets]]:data-[state=active]:from-violet-500/10 [&[data-value=assets]]:data-[state=active]:to-blue-500/10',
    '[&[data-value=scans]]:hover:from-emerald-50 [&[data-value=scans]]:hover:to-blue-50',
    '[&[data-value=scans]]:data-[state=active]:from-emerald-500/10 [&[data-value=scans]]:data-[state=active]:to-blue-500/10',
    '[&[data-value=incidents]]:hover:from-red-50 [&[data-value=incidents]]:hover:to-rose-50',
    '[&[data-value=incidents]]:data-[state=active]:from-red-500/10 [&[data-value=incidents]]:data-[state=active]:to-rose-500/10',
    '[&[data-value=dashboard]]:dark:hover:from-amber-900/20 [&[data-value=dashboard]]:dark:hover:to-orange-900/20',
    '[&[data-value=dashboard]]:dark:data-[state=active]:from-amber-400/20 [&[data-value=dashboard]]:dark:data-[state=active]:to-orange-400/20',
    '[&[data-value=assets]]:dark:hover:from-violet-900/20 [&[data-value=assets]]:dark:hover:to-blue-900/20',
    '[&[data-value=assets]]:dark:data-[state=active]:from-violet-400/20 [&[data-value=assets]]:dark:data-[state=active]:to-blue-400/20',
    '[&[data-value=scans]]:dark:hover:from-emerald-900/20 [&[data-value=scans]]:dark:hover:to-blue-900/20',
    '[&[data-value=scans]]:dark:data-[state=active]:from-emerald-400/20 [&[data-value=scans]]:dark:data-[state=active]:to-blue-400/20',
    '[&[data-value=incidents]]:dark:hover:from-red-900/20 [&[data-value=incidents]]:dark:hover:to-rose-900/20',
    '[&[data-value=incidents]]:dark:data-[state=active]:from-red-400/20 [&[data-value=incidents]]:dark:data-[state=active]:to-rose-400/20',
    'flex items-center gap-3 px-6',
    'group'
  );

  const iconBaseStyle = 'w-4 h-4 transition-all duration-300';

  const iconStyles = {
    dashboard:
      'text-amber-500 group-hover:text-orange-600 group-data-[state=active]:text-orange-600 dark:text-amber-400 dark:group-hover:text-orange-400 dark:group-data-[state=active]:text-orange-400',
    assets:
      'text-violet-500 group-hover:text-blue-600 group-data-[state=active]:text-blue-600 dark:text-violet-400 dark:group-hover:text-blue-400 dark:group-data-[state=active]:text-blue-400',
    scans:
      'text-emerald-500 group-hover:text-blue-600 group-data-[state=active]:text-blue-600 dark:text-emerald-400 dark:group-hover:text-blue-400 dark:group-data-[state=active]:text-blue-400',
    incidents:
      'text-red-500 group-hover:text-rose-600 group-data-[state=active]:text-rose-600 dark:text-red-400 dark:group-hover:text-rose-400 dark:group-data-[state=active]:text-rose-400',
  };

  return (
    <Tabs
      defaultValue={currentPath}
      value={currentPath}
      className={cn('relative w-full', className)}
    >
      <TabsList className="w-full justify-start rounded-xl border bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-md p-6 space-x-2">
        <TabsTrigger
          value="dashboard"
          onClick={() => handleNavigation('sca/dashboard')}
          className={tabStyle}
        >
          <div
            className={cn(
              'p-1.5 rounded-md bg-amber-100/50 dark:bg-amber-900/30',
              'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50',
              'group-data-[state=active]:bg-orange-100 dark:group-data-[state=active]:bg-orange-900/50',
              'transition-colors duration-300'
            )}
          >
            <Layout className={cn(iconBaseStyle, iconStyles.dashboard)} />
          </div>
          Dashboard
        </TabsTrigger>
        <TabsTrigger
          value="assets"
          onClick={() => handleNavigation('sca/assets')}
          className={tabStyle}
        >
          <div
            className={cn(
              'p-1.5 rounded-md bg-violet-100/50 dark:bg-violet-900/30',
              'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
              'group-data-[state=active]:bg-blue-100 dark:group-data-[state=active]:bg-blue-900/50',
              'transition-colors duration-300'
            )}
          >
            <BarChart2 className={cn(iconBaseStyle, iconStyles.assets)} />
          </div>
          Assets
        </TabsTrigger>
        <TabsTrigger
          value="scans"
          onClick={() => handleNavigation('sca/scans')}
          className={tabStyle}
        >
          <div
            className={cn(
              'p-1.5 rounded-md bg-emerald-100/50 dark:bg-emerald-900/30',
              'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
              'group-data-[state=active]:bg-blue-100 dark:group-data-[state=active]:bg-blue-900/50',
              'transition-colors duration-300'
            )}
          >
            <Shield className={cn(iconBaseStyle, iconStyles.scans)} />
          </div>
          Scans
        </TabsTrigger>
        <TabsTrigger
          value="incidents"
          onClick={() => handleNavigation('sca/incidents')}
          className={tabStyle}
        >
          <div
            className={cn(
              'p-1.5 rounded-md bg-red-100/50 dark:bg-red-900/30',
              'group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50',
              'group-data-[state=active]:bg-rose-100 dark:group-data-[state=active]:bg-rose-900/50',
              'transition-colors duration-300'
            )}
          >
            <AlertCircle className={cn(iconBaseStyle, iconStyles.incidents)} />
          </div>
          Incidents
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ScaAppTab;
