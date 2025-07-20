import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter } from 'lucide-react';
import { SelectVC } from '@/components/filter/SelectVC';
import { SelectRepo } from '@/components/filter/SelectRepo';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SelectPR from '@/components/filter/SelectPR';
import { API_BASE_URLS } from '@/config/api.config';

interface FilterField {
  key: string;
  label: string;
  type: 'api' | 'boolean';
}

interface FiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  commonAPIRequest?: any;
}

const PRScansFiltersBase: React.FC<FiltersProps> = ({
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
          api: `${API_BASE_URLS.development}/pr/scans/filter`,
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
    setSelectedFilters(tempFilters);
    onFiltersChange(tempFilters);
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

      case 'pr_id':
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

      case 'status':
        return (
          <div key={field.key} className="flex items-center justify-between space-x-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Switch
              id={field.key}
              checked={tempFilters[field.key] || false}
              onCheckedChange={(checked) => handleFilterChange(field.key, checked)}
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
            <DialogTitle>PR Scan Filters</DialogTitle>
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

export const PRScansFilters = withAPIRequest(PRScansFiltersBase);
