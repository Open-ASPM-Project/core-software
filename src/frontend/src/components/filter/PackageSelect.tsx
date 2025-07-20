import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Package {
  value: string;
  label: string;
}

interface PackageResponse {
  values: Package[];
  total: number;
}

interface PackageSelectProps {
  label: string;
  value: Package | null;
  onChange: (pkg: Package | null) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const PackageSelect: React.FC<PackageSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchPackages = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}package/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type,
          },
        },
        (response: PackageResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setPackages(response.values);
            } else {
              setPackages((prev) => [...prev, ...response.values]);
            }
            setHasMore(packages.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setPackages([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, packages.length]
  );

  useEffect(() => {
    setPage(1);
    setPackages([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchPackages(searchQuery), 300);
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

  const getPackageSource = (packageName: string): string => {
    if (packageName.startsWith('golang.org/')) return 'Go';
    if (packageName.includes('/')) return 'npm';
    return 'Package';
  };

  const getPackageColor = (source: string): string => {
    switch (source) {
      case 'Go':
        return 'text-blue-500';
      case 'npm':
        return 'text-red-500';
      default:
        return 'text-green-500';
    }
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
              {value.map((pkg) => (
                <Badge key={pkg.value} variant="secondary" className="flex items-center gap-1">
                  <Package
                    className={cn('h-3 w-3', getPackageColor(getPackageSource(pkg.value)))}
                  />
                  {pkg.label}
                  <X
                    className="h-3 w-3 hover:text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((v) => v.value !== pkg.value));
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            'Select packages...'
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {packages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No packages found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {packages.map((pkg) => {
                  const isSelected = value.some((v) => v.value === pkg.value);
                  const source = getPackageSource(pkg.value);
                  return (
                    <div
                      key={pkg.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          onChange(value.filter((v) => v.value !== pkg.value));
                        } else {
                          onChange([...value, pkg]);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full',
                          'flex items-center justify-center',
                          'bg-accent/50',
                          isSelected ? 'text-primary' : getPackageColor(source)
                        )}
                      >
                        <Package className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{pkg.label}</span>
                          {isSelected && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'h-4 px-1',
                              source === 'Go' && 'bg-blue-500/10 text-blue-500',
                              source === 'npm' && 'bg-red-500/10 text-red-500',
                              source === 'Package' && 'bg-green-500/10 text-green-500'
                            )}
                          >
                            {source}
                          </Badge>
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

export default PackageSelect;
