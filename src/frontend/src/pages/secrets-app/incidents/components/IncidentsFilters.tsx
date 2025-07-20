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

import AuthorSelect from '@/components/filter/AuthorSelect';
// import TypeSelect from '@/components/filter/TypeSelect';
import SeveritySelect from '@/components/filter/SeveritySelect';
import SelectPR from '@/components/filter/SelectPR';
// import SelectGroup from '@/components/filter/SelectGroup';
import CommitSelect from '@/components/filter/CommitSelect';
import RuleSelect from '@/components/filter/RuleSelect';
import MessageSelect from '@/components/filter/MessageSelect';
import DescriptionSelect from '@/components/filter/DescriptionSelect';
import EmailSelect from '@/components/filter/EmailSelect';
import { API_BASE_URLS } from '@/config/api.config';
import { Label } from '@/components/ui/label';
import ScanTypeSelect from '@/components/filter/ScanTypeSelect';
import SecretSelect from '@/components/filter/SecretSelect';
import { SelectGroups } from '@/components/filter/SelectGroup';
// import EmailSelect from '@/components/filter/EmailSelect';

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
  return d.toISOString().split('T')[0]; // This will return YYYY-MM-DD format
};

const IncidentFiltersBase: React.FC<FiltersProps> = ({
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
  const initialLoadDone = React.useRef(false);

  useEffect(() => {
    const loadFiltersFromUrl = async () => {
      const urlFilters: Record<string, any> = {};
      let hasUrlParams = false;

      // Handle secret parameter
      const secret = searchParams.get('secret');
      if (secret) {
        urlFilters.secret = { value: secret, label: secret };
        hasUrlParams = true;
      }

      // Handle commit parameter
      const commit = searchParams.get('commit');
      if (commit) {
        urlFilters.commit = { value: commit, label: commit };
        hasUrlParams = true;
      }

      // Handle PR Scan parameter
      const pr_scan_id = searchParams.get('pr_scan_id');
      if (pr_scan_id) {
        urlFilters.pr_scan_id = { value: pr_scan_id, label: pr_scan_id };
        hasUrlParams = false;
      }

      // Handle scan_type parameter
      const scan_type = searchParams.get('scan_type');
      if (scan_type) {
        urlFilters.scan_type = { value: scan_type, label: scan_type };
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

      // Handle pr_id parameter
      const prId = searchParams.get('pr_id');
      if (prId) {
        try {
          hasUrlParams = true;
          await new Promise((resolve) => {
            commonAPIRequest(
              {
                api: `${API_BASE_URLS.development}/pr/${prId}`,
                method: 'GET',
              },
              (response) => {
                if (response) {
                  urlFilters.pr_ids = [{ id: parseInt(prId), pr_name: response.pr_name }];
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
  }, []); // Run once on mount

  const updateFiltersFromUrl = (urlFilters: Record<string, any>) => {
    setSelectedFilters((prev) => ({
      ...prev,
      ...urlFilters,
    }));
    setTempFilters((prev) => ({
      ...prev,
      ...urlFilters,
    }));
    onFiltersChange(urlFilters);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/incident/filters?type=secret`,
          method: 'GET',
        },
        (response) => {
          setLoading(false);
          if (response?.filters) {
            console.log('filtesrss', response?.filters);
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
              type="secret"
            />
          </div>
        );

      case 'secrets':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <SecretSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(secrets) => handleFilterChange(field.key, secrets)}
              commonAPIRequest={commonAPIRequest}
              path="/secrets/filters/"
              type="secret"
            />
          </div>
        );

      case 'descriptions':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <DescriptionSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(descriptions) => handleFilterChange(field.key, descriptions)} // Now handles an array of descriptions
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
            />
          </div>
        );

      case 'messages':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <MessageSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(messages) => handleFilterChange(field.key, messages)} // Now receives array of messages
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
            />
          </div>
        );

      case 'rules':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <RuleSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(rules) => handleFilterChange(field.key, rules)} // Now handles array of rules
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
            />
          </div>
        );

      case 'commits':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <CommitSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(commits) => handleFilterChange(field.key, commits)} // Now handles array of commits
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
            />
          </div>
        );

      case 'emails':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <EmailSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(emails) => handleFilterChange(field.key, emails)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
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

      case 'authors':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <AuthorSelect
              label={field.label}
              value={tempFilters[field.key] || []}
              onChange={(authors) => handleFilterChange(field.key, authors)}
              commonAPIRequest={commonAPIRequest}
              path="/incident/filters/"
              type="secret"
            />
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

export const IncidentFilters = withAPIRequest(IncidentFiltersBase);
