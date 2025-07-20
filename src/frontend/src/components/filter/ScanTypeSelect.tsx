import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URLS } from '@/config/api.config';

interface ScanType {
  value: string;
  label: string;
}

interface ScanTypeSelectProps {
  label: string;
  value: ScanType | null;
  onChange: (scanType: ScanType | null) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const ScanTypeSelect: React.FC<ScanTypeSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScanTypes = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}scan_type/values`,
          method: 'GET',
          params: { search: query || undefined, type: type },
        },
        (response: { values: ScanType[] }) => {
          setLoading(false);
          if (response?.values) setScanTypes(response.values);
        }
      );
    },
    [commonAPIRequest, loading, path]
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchScanTypes(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, open]);

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          className={cn('w-full justify-between', !value && 'text-muted-foreground')}
        >
          {value ? (
            <span className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              {value.label}
            </span>
          ) : (
            'Select scan type...'
          )}
        </Button>

        {value && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 
         hover:bg-accent/70
         transition-colors
         rounded-md"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scan types..."
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
            ) : scanTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Radio className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No scan types found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div className="p-2">
                {scanTypes.map((scanType) => (
                  <div
                    key={scanType.value}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                      'transition-all duration-200',
                      value?.value === scanType.value
                        ? 'bg-accent/70 hover:bg-accent/80'
                        : 'hover:bg-accent/50'
                    )}
                    onClick={() => {
                      onChange(scanType);
                      setOpen(false);
                    }}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full',
                        'flex items-center justify-center',
                        'bg-accent/50',
                        value?.value === scanType.value ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <Radio className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{scanType.label}</span>
                        {value?.value === scanType.value && (
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
                        value?.value === scanType.value
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted hover:border-muted-foreground'
                      )}
                    >
                      {value?.value === scanType.value && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScanTypeSelect;
