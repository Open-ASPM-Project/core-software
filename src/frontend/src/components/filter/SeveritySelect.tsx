import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URLS } from '@/config/api.config';

interface Severity {
  value: string;
  label: string;
}

interface SeveritySelectProps {
  label: string;
  value: Severity[];
  onChange: (severities: Severity[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const SeveritySelect: React.FC<SeveritySelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [severities, setSeverities] = useState<Severity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getSeverityColor = (severityValue: string) => {
    switch (severityValue) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      case 'unknown':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const fetchSeverities = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}severity/values`,
          method: 'GET',
          params: { search: query || undefined, type: type },
        },
        (response: { values: Severity[] }) => {
          setLoading(false);
          if (response?.values) setSeverities(response.values);
        }
      );
    },
    [commonAPIRequest, loading, path, type]
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchSeverities(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, open]);

  const toggleSeverity = (severity: Severity) => {
    const isSelected = value.some((s) => s.value === severity.value);
    if (isSelected) {
      onChange(value.filter((s) => s.value !== severity.value));
    } else {
      onChange([...value, severity]);
    }
  };

  const removeSeverity = (severityToRemove: Severity, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((s) => s.value !== severityToRemove.value));
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          className={cn(
            'w-full justify-start min-h-[40px] h-auto py-2',
            !value.length && 'text-muted-foreground'
          )}
        >
          <div className="flex flex-wrap gap-1.5 px-1">
            {value.length > 0 ? (
              value.map((severity) => (
                <div key={severity.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <AlertCircle className={cn('h-3 w-3', getSeverityColor(severity.value))} />
                    <span>{severity.label}</span>
                    <button
                      onClick={(e) => removeSeverity(severity, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select severities...</span>
            )}
          </div>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search severities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : severities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No severities found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div className="p-2">
                {severities.map((severity) => {
                  const isSelected = value.some((s) => s.value === severity.value);
                  return (
                    <div
                      key={severity.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleSeverity(severity)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full',
                          'flex items-center justify-center',
                          'bg-accent/50'
                        )}
                      >
                        <AlertCircle className={cn('h-5 w-5', getSeverityColor(severity.value))} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate capitalize">{severity.label}</span>
                          {isSelected && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          'h-5 w-5 rounded-md border-2',
                          'flex items-center justify-center',
                          'transition-colors duration-200',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted hover:border-muted-foreground'
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeveritySelect;
