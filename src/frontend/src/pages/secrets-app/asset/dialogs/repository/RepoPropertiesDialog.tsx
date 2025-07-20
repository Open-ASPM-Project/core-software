import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  Database,
  Building2,
  Scale,
  CalendarClock,
  User,
  AlertCircle,
  Settings2,
  Trash2,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_ENDPOINTS, createEndpointUrl } from '@/config/api.config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PropertyUpdateDialog from './PropertyUpdateDialog';
import { values } from 'lodash';

const propertyConfigs = {
  business_criticality: {
    icon: Building2,
    title: 'Business Criticality',
    iconType: 'business' as const,
  },
  environment: {
    icon: Database,
    title: 'Environment',
    iconType: 'environment' as const,
  },
  data_sensitivity: {
    icon: Shield,
    title: 'Data Sensitivity',
    iconType: 'security' as const,
  },
  regulatory_requirement: {
    icon: Scale,
    title: 'Regulatory Requirement',
    iconType: 'regulatory' as const,
  },
};

const getPropertyTypeKey = (iconType: 'business' | 'environment' | 'security' | 'regulatory') => {
  const propertyMap = {
    business: 'business_criticalities',
    environment: 'environments',
    security: 'data_sensitivities',
    regulatory: 'regulatory_requirements',
  };

  return propertyMap[iconType];
};

interface Property {
  id: number;
  value: number;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface Properties {
  business_criticality: Property;
  environment: Property;
  data_sensitivity: Property;
  regulatory_requirement: Property;
}

interface RepoPropertiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  repoId: number;
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

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-muted/30 rounded-lg p-4 border">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    ))}
  </div>
);

const PlaceholderPropertyCard = ({
  icon: Icon,
  title,
  iconType,
  onUpdate, // Changed from onAdd to onUpdate to match PropertyCard
  commonAPIRequest, // Add this to pass to PropertyUpdateDialog
}: {
  icon: React.ElementType;
  title: string;
  iconType: 'business' | 'environment' | 'security' | 'regulatory';
  onUpdate: (value: number) => void;
  commonAPIRequest: any; // Add proper typing as per your implementation
}) => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const iconStyles = {
    business: {
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    environment: {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    security: {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    regulatory: {
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  }[iconType];

  return (
    <>
      <div className="group bg-muted/10 rounded-lg p-4 flex flex-col gap-3 border border-dashed hover:border-primary/20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${iconStyles.bgColor}`}>
              <Icon className={`h-4 w-4 ${iconStyles.iconColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">Not configured</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpdateDialog(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      <PropertyUpdateDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        title={title}
        currentValue={null}
        propertyType={getPropertyTypeKey(iconType)}
        onUpdate={onUpdate}
        commonAPIRequest={commonAPIRequest}
      />
    </>
  );
};

const EmptyState = ({
  onConfigureClick,
  commonAPIRequest,
  repoId,
  fetchProperties,
}: {
  onConfigureClick: (propertyType: string) => void;
  commonAPIRequest: any; // Add proper typing as per your implementation
  repoId: number;
  fetchProperties: () => void;
}) => {
  const [showCards, setShowCards] = useState(false);

  if (showCards) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(propertyConfigs).map(([key, config]) => (
          <PlaceholderPropertyCard
            key={key}
            icon={config.icon}
            title={config.title}
            iconType={config.iconType}
            commonAPIRequest={commonAPIRequest} // Need to pass this from parent
            onUpdate={(propertyId) => {
              const endpoint = API_ENDPOINTS.repository.updateRepositoryPropertyValue;
              const apiUrl = createEndpointUrl(endpoint);
              const propertyType = getPropertyTypeKey(config.iconType);

              commonAPIRequest(
                {
                  api: `${apiUrl}${repoId}/properties`,
                  method: 'POST',
                  data: {
                    property_id: propertyId,
                    property_type: propertyType,
                  },
                },
                () => {
                  // After successful update, you might want to refresh the properties
                  fetchProperties();
                }
              );
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          {
            icon: Building2,
            color: 'text-blue-400 dark:text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          },
          {
            icon: Database,
            color: 'text-green-400 dark:text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
          },
          {
            icon: Shield,
            color: 'text-red-400 dark:text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
          },
          {
            icon: Scale,
            color: 'text-purple-400 dark:text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          },
        ].map(({ icon: Icon, color, bgColor }, index) => (
          <div key={index} className={`${bgColor} rounded-lg p-3 flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        ))}
      </div>
      <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] mb-6">
        This repository doesn't have any properties configured yet. Properties help classify and
        manage repository settings.
      </p>
      <Button
        variant="outline"
        className="min-w-[140px] bg-zinc-900 hover:bg-zinc-800 text-zinc-100 gap-2"
        onClick={() => setShowCards(true)}
      >
        <Settings2 className="h-4 w-4" />
        Configure Now
      </Button>
    </div>
  );
};

const PropertyCard = ({
  icon: Icon,
  title,
  value,
  score,
  timestamp,
  lastUpdatedBy,
  iconType,
  onDelete,
  onUpdate,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  score: number;
  timestamp: string;
  lastUpdatedBy: string;
  iconType: 'business' | 'environment' | 'security' | 'regulatory';
  onDelete: () => void;
  onUpdate: (value: number) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number>(score / 100);

  const iconStyles = {
    business: {
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    environment: {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    security: {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    regulatory: {
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  }[iconType];

  const valueOptions = [
    { label: 'Low', value: 0.25 },
    { label: 'Medium', value: 0.5 },
    { label: 'High', value: 0.75 },
    { label: 'Critical', value: 1 },
  ];

  return (
    <div className="group bg-muted/30 rounded-lg p-4 flex flex-col gap-3 border hover:border-primary/20 transition-colors relative">
      {/* Action Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => setShowUpdateDialog(true)}
          >
            <Settings2 className="h-4 w-4" />
            Update Property
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 flex items-center gap-2"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-md ${iconStyles.bgColor}`}>
            <Icon className={`h-4 w-4 ${iconStyles.iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`font-mono me-4 ${
            score >= 75
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : score >= 50
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          Value: {score / 100}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          <span>
            {new Date(timestamp).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>Updated by: {lastUpdatedBy}</span>
        </div>
      </div>

      {/* Update Dialog */}
      <PropertyUpdateDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        title={title}
        currentValue={null}
        propertyType={getPropertyTypeKey(iconType)}
        onUpdate={onUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {title} property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
const RepoPropertiesDialog: React.FC<RepoPropertiesDialogProps> = ({
  isOpen,
  onClose,
  repoName,
  repoId,
  commonAPIRequest,
}) => {
  const [properties, setProperties] = useState<Properties | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log('commonAPIRequest', commonAPIRequest);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null);

  const fetchProperties = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const endpoint = API_ENDPOINTS.repository.getRepositoryProperties;
    const apiUrl = createEndpointUrl(endpoint);

    commonAPIRequest<Properties>(
      {
        api: `${apiUrl}${repoId}/properties`,
        method: endpoint.method,
      },
      (response) => {
        setIsLoading(false);
        if (response) {
          setProperties(response);
        }
      }
    );
  }, [repoId, commonAPIRequest]);

  useEffect(() => {
    if (isOpen && repoId) {
      console.log('inside');

      fetchProperties();
    } else {
      // Reset states when dialog closes
      setProperties(null);
      setError(null);
    }
  }, [isOpen, repoId]);

  const handleClose = () => {
    setProperties(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 
   dark:from-violet-600/20 dark:to-blue-600/20 
   border-b border-violet-100 dark:border-violet-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle>Repository Properties</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Badge variant="outline" className="font-normal">
                  {repoName}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-0" />

        <ScrollArea className="max-h-[calc(100vh-200px)] p-3">
          <div className="py-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <LoadingSkeleton />
            ) : properties && Object.keys(properties).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(propertyConfigs).map(([key, config]) => {
                  const property = properties?.[key as keyof Properties];

                  return property ? (
                    <PropertyCard
                      key={key}
                      icon={config.icon}
                      title={config.title}
                      value={property.name}
                      score={property.value * 100}
                      timestamp={property.updated_at}
                      lastUpdatedBy={property.updated_by}
                      iconType={config.iconType}
                      onDelete={() => {
                        const endpoint = API_ENDPOINTS.repository.deleteRepositoryProperty;
                        const apiUrl = createEndpointUrl(endpoint);
                        const propertyType = getPropertyTypeKey(config.iconType);

                        commonAPIRequest(
                          {
                            api: `${apiUrl}${repoId}/properties?property_type=${propertyType}`,
                            method: 'DELETE',
                          },
                          () => {
                            fetchProperties();
                          }
                        );
                      }}
                      onUpdate={(propertyId) => {
                        console.log('values', propertyId);
                        const endpoint = API_ENDPOINTS.repository.updateRepositoryPropertyValue;
                        const apiUrl = createEndpointUrl(endpoint);
                        const propertyType = getPropertyTypeKey(config.iconType);

                        commonAPIRequest(
                          {
                            api: `${apiUrl}${repoId}/properties`,
                            method: 'POST',
                            data: {
                              property_id: propertyId,
                              property_type: propertyType,
                            },
                          },
                          () => {
                            fetchProperties();
                          }
                        );
                      }}
                    />
                  ) : (
                    <PlaceholderPropertyCard
                      key={key}
                      icon={config.icon}
                      title={config.title}
                      iconType={config.iconType}
                      commonAPIRequest={commonAPIRequest}
                      onUpdate={(propertyId) => {
                        const endpoint = API_ENDPOINTS.repository.updateRepositoryPropertyValue;
                        const apiUrl = createEndpointUrl(endpoint);
                        const propertyType = getPropertyTypeKey(config.iconType);

                        commonAPIRequest(
                          {
                            api: `${apiUrl}${repoId}/properties`,
                            method: 'POST',
                            data: {
                              property_id: propertyId,
                              property_type: propertyType,
                            },
                          },
                          () => {
                            fetchProperties();
                          }
                        );
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState
                onConfigureClick={(propertyType) => {
                  setShowUpdateDialog(true);
                  setSelectedPropertyType(propertyType);
                }}
                commonAPIRequest={commonAPIRequest}
                repoId={repoId}
                fetchProperties={fetchProperties}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default withAPIRequest(RepoPropertiesDialog);
