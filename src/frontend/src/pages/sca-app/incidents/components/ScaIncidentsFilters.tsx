import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter, X, CalendarIcon } from 'lucide-react';
import { SelectVC } from '@/components/filter/SelectVC';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { Calendar } from '@/components/ui/calendar';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

import SeveritySelect from '@/components/filter/SeveritySelect';
import SelectPR from '@/components/filter/SelectPR';
import { SelectGroups } from '@/components/filter/SelectGroup';
import { API_BASE_URLS } from '@/config/api.config';
import { Label } from '@/components/ui/label';
import ScanTypeSelect from '@/components/filter/ScanTypeSelect';
// import VulnerabilitySelect from '@/components/filter/VulnerabilitySelect';
import PackageSelect from '@/components/filter/PackageSelect';
import PackageVersionSelect from '@/components/filter/PackageVersionSelect';
import ArtifactTypeSelect from '@/components/filter/ArtifactTypeSelect';
import ArtifactPathSelect from '@/components/filter/ArtifactPathSelect';
import LicenseSelect from '@/components/filter/LicenseSelect';
import { SelectVulnerability } from '@/components/filter/SelectVulnerability';
import CVESelect from '@/components/filter/CVESelect';
import VulnerabilityTypeSelect from '@/components/filter/VulnerabilityTypeSelect';

interface FilterField {
  key: string;
  label: string;
  type: string;
  searchable: boolean;
}

interface FiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  commonAPIRequest?: any;
}

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const ScaIncidentFiltersBase: React.FC<FiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  commonAPIRequest,
}) => {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>(initialFilters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFiltersFromUrl = async () => {
      const urlFilters: Record<string, any> = {};
      let hasUrlParams = false;

      // Handle vulnerability_id parameter
      const vulnerabilityId = searchParams.get('vulnerability_id');
      if (vulnerabilityId) {
        urlFilters.vulnerability_id = { value: vulnerabilityId, label: vulnerabilityId };
        hasUrlParams = true;
      }

      // Handle scan_type parameter
      const scanType = searchParams.get('scan_type');
      if (scanType) {
        urlFilters.scan_type = { value: scanType, label: scanType };
        hasUrlParams = true;
      }

      // Handle repo_id parameter
      const repoId = searchParams.get('repo_id');
      if (repoId) {
        try {
          hasUrlParams = true;
          await new Promise((resolve) => {
            commonAPIRequest(
              {
                api: `${API_BASE_URLS.development}/repo/${repoId}`,
                method: 'GET',
              },
              (response) => {
                if (response) {
                  urlFilters.repo_ids = [{ id: parseInt(repoId), name: response.name }];
                  resolve(response);
                }
              }
            );
          });
        } catch (error) {
          console.error('Error fetching repo details:', error);
        }
      }

      // Only update filters if URL params exist
      if (hasUrlParams) {
        setSelectedFilters((prev) => ({ ...prev, ...urlFilters }));
        setTempFilters((prev) => ({ ...prev, ...urlFilters }));
        onFiltersChange(urlFilters);
      }
    };

    loadFiltersFromUrl();
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/incident/filters?type=vulnerability`,
          method: 'GET',
        },
        (response) => {
          setLoading(false);
          if (response?.filters) {
            setFields(response.filters);
          }
        }
      );
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTempFilters(selectedFilters);
    }
  }, [open]);

  const handleFilterChange = (key: string, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllFilters = () => {
    setTempFilters({});
  };

  const handleApplyFilters = () => {
    const formattedFilters = Object.entries(tempFilters).reduce(
      (acc, [key, value]) => {
        const field = fields.find((f) => f.key === key);
        if (field?.type === 'datetime' && value instanceof Date) {
          acc[key] = value.toISOString();
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    setSelectedFilters(formattedFilters);
    onFiltersChange(formattedFilters);
    setOpen(false);
  };

  const handleCancelFilters = () => {
    setTempFilters(selectedFilters);
    setOpen(false);
  };

  const hasFilterChanges = () => {
    return JSON.stringify(selectedFilters) !== JSON.stringify(tempFilters);
  };

  const getSelectedCount = () => {
    return Object.values(tempFilters).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value != null
    ).length;
  };

  const renderFilterField = (field: FilterField) => {
    switch (field.key) {
      case 'severities':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <SeveritySelect
              label={field.label}
              value={tempFilters[field.key] || []} // Initialize with empty array if no value
              onChange={(severities) => handleFilterChange(field.key, severities)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'scan_type':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <ScanTypeSelect
              label={field.label}
              value={tempFilters[field.key] || null}
              onChange={(scanType) => handleFilterChange(field.key, scanType)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'vulnerability_ids':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <SelectVulnerability
              label={field.label}
              placeholder="Select vulnerabilities..."
              selectedValues={tempFilters[field.key] || []}
              onSelectedChange={(values) => handleFilterChange(field.key, values)}
            />
          </div>
        );

      case 'packages':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <PackageSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed to empty array as default
              onChange={(packages) => handleFilterChange(field.key, packages)}
              commonAPIRequest={commonAPIRequest}
              path="/vulnerabilities/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'package_versions':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <PackageVersionSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed from null to empty array
              onChange={(versions) => handleFilterChange(field.key, versions)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'cve_ids':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <CVESelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed to empty array as default
              onChange={(cves) => handleFilterChange(field.key, cves)}
              commonAPIRequest={commonAPIRequest}
              path="/vulnerabilities/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'artifact_types':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <ArtifactTypeSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed to empty array as default
              onChange={(types) => handleFilterChange(field.key, types)}
              commonAPIRequest={commonAPIRequest}
              path="/vulnerabilities/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'artifact_paths':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <ArtifactPathSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed from null to empty array
              onChange={(paths) => handleFilterChange(field.key, paths)} // paths is now an array
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'vulnerability_types':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <VulnerabilityTypeSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Initialize with empty array
              onChange={(types) => handleFilterChange(field.key, types)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'licenses':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <LicenseSelect
              label={field.label}
              value={tempFilters[field.key] || []} // Changed to empty array as default
              onChange={(licenses) => handleFilterChange(field.key, licenses)}
              commonAPIRequest={commonAPIRequest}
              path="/vulnerabilities/filters/"
              type="vulnerability"
            />
          </div>
        );

      case 'vc_ids':
        return (
          <div key={field.key} className="space-y-2">
            <SelectVC
              label={field.label}
              placeholder="Select version controls..."
              selectedValues={tempFilters[field.key] || []}
              onSelectedChange={(values) => handleFilterChange(field.key, values)}
            />
          </div>
        );

      case 'repo_ids':
        return (
          <div key={field.key} className="space-y-2">
            <SelectRepo
              label={field.label}
              placeholder="Select repositories..."
              selectedValues={tempFilters[field.key] || []}
              onSelectedChange={(values) => handleFilterChange(field.key, values)}
            />
          </div>
        );

      case 'pr_ids':
        return (
          <div key={field.key} className="space-y-2">
            <SelectPR
              label={field.label}
              placeholder="Select pull requests..."
              selectedValues={tempFilters[field.key] || []}
              onSelectedChange={(values) => handleFilterChange(field.key, values)}
            />
          </div>
        );

      case 'group_ids':
        return (
          <div key={field.key} className="space-y-2">
            <SelectGroups
              label={field.label}
              placeholder="Select groups..."
              selectedValues={tempFilters[field.key] || []}
              onSelectedChange={(values) => handleFilterChange(field.key, values)}
            />
          </div>
        );

      case 'whitelisted':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select
              value={tempFilters[field.key]?.toString() || ''}
              onValueChange={(value) =>
                handleFilterChange(field.key, value === 'null' ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{field.label}</SelectLabel>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value={'null'}>All</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );

      case 'created_after':
      case 'created_before':
      case 'updated_after':
      case 'updated_before':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal relative',
                    !tempFilters[field.key] && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempFilters[field.key] ? (
                    formatDate(tempFilters[field.key])
                  ) : (
                    <span>Pick a date</span>
                  )}
                  {tempFilters[field.key] && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div
                        role="button"
                        tabIndex={0}
                        className="p-1 hover:bg-destructive/10 rounded-full cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFilterChange(field.key, null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFilterChange(field.key, null);
                          }
                        }}
                      >
                        <X className="h-4 w-4 hover:text-destructive" />
                      </div>
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempFilters[field.key] ? new Date(tempFilters[field.key]) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleFilterChange(field.key, date.toISOString().split('T')[0]);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'fix_available':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select
              value={tempFilters[field.key]?.toString() || ''}
              onValueChange={(value) =>
                handleFilterChange(field.key, value === 'null' ? null : value === 'true')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{field.label}</SelectLabel>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="null">All</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleCancelFilters();
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {getSelectedCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getSelectedCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Filters</DialogTitle>
          </div>
        </DialogHeader>
        <Separator className="my-1" />
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-6">{fields.map((field) => renderFilterField(field))}</div>
        </ScrollArea>
        <Separator className="my-1" />
        <DialogFooter className="flex justify-end sm:justify-end gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={clearAllFilters} disabled={getSelectedCount() === 0}>
              Clear all
            </Button>
            <Button onClick={handleApplyFilters} disabled={!hasFilterChanges()}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ScaIncidentFilters = withAPIRequest(ScaIncidentFiltersBase);
