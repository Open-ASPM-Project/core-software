import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface ArtifactType {
  value: string;
  label: string;
}

interface ArtifactTypeResponse {
  values: ArtifactType[];
  total: number;
}

interface ArtifactTypeSelectProps {
  label: string;
  value: ArtifactType[];
  onChange: (artifactTypes: ArtifactType[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const ArtifactTypeSelect: React.FC<ArtifactTypeSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [artifactTypes, setArtifactTypes] = useState<ArtifactType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArtifactTypes = useCallback(
    (query: string) => {
      setLoading(true);
      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}artifact_type/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            type,
          },
        },
        (response: ArtifactTypeResponse) => {
          setLoading(false);
          if (response?.values) {
            setArtifactTypes(response.values);
          } else {
            setArtifactTypes([]);
          }
        }
      );
    },
    [commonAPIRequest, path]
  );

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchArtifactTypes(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, open, fetchArtifactTypes]);

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
              {value.map((type) => (
                <Badge key={type.value} variant="secondary" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {type.label}
                  <X
                    className="h-3 w-3 hover:text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((v) => v.value !== type.value));
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            'Select artifact types...'
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search artifact types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {artifactTypes.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No artifact types found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {artifactTypes.map((type) => {
                  const isSelected = value.some((v) => v.value === type.value);
                  return (
                    <div
                      key={type.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          onChange(value.filter((v) => v.value !== type.value));
                        } else {
                          onChange([...value, type]);
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
                        <Package className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{type.label}</span>
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

export default ArtifactTypeSelect;
