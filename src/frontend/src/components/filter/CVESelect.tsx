import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CVE {
  value: string;
  label: string;
}

interface CVEResponse {
  values: CVE[];
  total: number;
}

interface CVESelectProps {
  label: string;
  value: CVE | null;
  onChange: (cve: CVE | null) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const CVESelect: React.FC<CVESelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cves, setCves] = useState<CVE[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchCVEs = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}cve_id/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type,
          },
        },
        (response: CVEResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setCves(response.values);
            } else {
              setCves((prev) => [...prev, ...response.values]);
            }
            setHasMore(cves.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setCves([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, cves.length]
  );

  useEffect(() => {
    setPage(1);
    setCves([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchCVEs(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, page, open]);

  useEffect(() => {
    const currentLoader = loadingRef.current;
    if (!currentLoader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(currentLoader);
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading]);

  const getCVEYear = (cveId: string): number | null => {
    const match = cveId.match(/CVE-(\d{4})-/);
    return match ? parseInt(match[1]) : null;
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
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1 items-center">
              {value.map((cve) => (
                <Badge key={cve.value} variant="secondary" className="flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-red-500" />
                  {cve.label}
                  <X
                    className="h-3 w-3 hover:text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((v) => v.value !== cve.value));
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            'Select CVEs...'
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CVEs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {cves.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ShieldAlert className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No CVEs found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {cves?.map((cve) => {
                  const isSelected = value.some((v) => v.value === cve.value);
                  const year = getCVEYear(cve.value);
                  return (
                    <div
                      key={cve.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          onChange(value.filter((v) => v.value !== cve.value));
                        } else {
                          onChange([...value, cve]);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full',
                          'flex items-center justify-center',
                          'bg-accent/50',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <ShieldAlert className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{cve.label}</span>
                          {isSelected && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        {year && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <span>Published in {year}</span>
                          </div>
                        )}
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
                <div ref={loadingRef} className="py-2 flex items-center justify-center">
                  {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CVESelect;
