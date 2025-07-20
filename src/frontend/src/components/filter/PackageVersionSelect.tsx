import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface PackageVersion {
  value: string;
  label: string;
}

interface PackageVersionResponse {
  values: PackageVersion[];
  total: number;
}

interface PackageVersionSelectProps {
  label: string;
  value: PackageVersion[];
  onChange: (packageVersions: PackageVersion[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const PackageVersionSelect: React.FC<PackageVersionSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packageVersions, setPackageVersions] = useState<PackageVersion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPackageVersions = useCallback(
    (query: string) => {
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}package_version/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            type,
          },
        },
        (response: PackageVersionResponse) => {
          setLoading(false);
          if (response?.values) {
            setPackageVersions(response.values);
          } else {
            setPackageVersions([]);
          }
        }
      );
    },
    [commonAPIRequest, path, type]
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchPackageVersions(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, open, fetchPackageVersions]);

  const getVersionType = (version: string): string => {
    if (version.includes('alpha')) return 'alpha';
    if (version.includes('beta')) return 'beta';
    if (version.includes('rc')) return 'rc';
    if (version.includes('incompatible')) return 'incompatible';
    return 'stable';
  };

  const getVersionBadgeVariant = (
    type: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'alpha':
        return 'destructive';
      case 'beta':
      case 'rc':
        return 'secondary';
      case 'incompatible':
        return 'outline';
      default:
        return 'default';
    }
  };

  const toggleVersion = (version: PackageVersion) => {
    const isSelected = value.some((v) => v.value === version.value);
    if (isSelected) {
      onChange(value.filter((v) => v.value !== version.value));
    } else {
      onChange([...value, version]);
    }
  };

  const removeVersion = (versionToRemove: PackageVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== versionToRemove.value));
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
              value.map((version) => (
                <div key={version.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <Tag className="h-3 w-3" />
                    <span>{version.label}</span>
                    <button
                      onClick={(e) => removeVersion(version, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select package versions...</span>
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
                placeholder="Search versions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {packageVersions.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No versions found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {packageVersions.map((version) => {
                  const versionType = getVersionType(version.value);
                  const isSelected = value.some((v) => v.value === version.value);
                  return (
                    <div
                      key={version.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleVersion(version)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full',
                          'flex items-center justify-center',
                          'bg-accent/50',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <Tag className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{version.label}</span>
                          {versionType !== 'stable' && (
                            <Badge variant={getVersionBadgeVariant(versionType)} className="h-5">
                              {versionType}
                            </Badge>
                          )}
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
                {loading && (
                  <div className="py-2 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PackageVersionSelect;
