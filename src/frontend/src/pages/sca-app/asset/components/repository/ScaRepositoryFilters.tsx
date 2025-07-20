import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Filter, X, CalendarIcon } from 'lucide-react';
import { SelectVC } from '@/components/filter/SelectVC';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { Calendar } from '@/components/ui/calendar';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { cn } from '@/lib/utils';
import AuthorSelect from '@/components/filter/AuthorSelect';
import { API_BASE_URLS } from '@/config/api.config';

interface FilterField {
  key: string;
  label: string;
  type: 'integer' | 'datetime' | 'text';
  searchable: boolean;
}

interface FiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  commonAPIRequest?: any;
}

const formatDate = (date: Date | string | null) => {
  if (!date) return '';
  // If it's an ISO string, convert to Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const RepositoryFiltersBase: React.FC<FiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  commonAPIRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<FilterField[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>(initialFilters);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}/repo/filters`,
          method: 'GET',
        },
        (response) => {
          setLoading(false);
          if (response) {
            setFields(response);
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
    // Convert Date objects to ISO strings for datetime fields
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

      case 'created_after':
      case 'created_before':
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
                  onSelect={(date) => handleFilterChange(field.key, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'author':
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">{field.label}</label>
            <AuthorSelect
              label={field.label}
              value={tempFilters[field.key] || null}
              onChange={(author) => handleFilterChange(field.key, author)}
              commonAPIRequest={commonAPIRequest}
              path="/repo/filters/"
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

export const ScaRepositoryFilters = withAPIRequest(RepositoryFiltersBase);
