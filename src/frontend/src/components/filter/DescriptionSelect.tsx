import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Loader2,
  Search,
  FileText,
  X,
  ShieldAlert,
  KeyRound,
  CloudCog,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface Description {
  value: string;
  label: string;
}

interface DescriptionResponse {
  values: Description[];
  total: number;
}

interface DescriptionSelectProps {
  label: string;
  value: Description[];
  onChange: (descriptions: Description[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const getDescriptionTypeInfo = (
  description: string
): {
  icon: JSX.Element;
  badge: { text: string; className: string };
} => {
  if (description.toLowerCase().includes('github')) {
    return {
      icon: <KeyRound className="h-5 w-5 text-amber-500" />,
      badge: { text: 'GitHub', className: 'bg-amber-500/10 text-amber-500' },
    };
  }
  if (description.toLowerCase().includes('aws')) {
    return {
      icon: <CloudCog className="h-5 w-5 text-orange-500" />,
      badge: { text: 'AWS', className: 'bg-orange-500/10 text-orange-500' },
    };
  }
  if (description.toLowerCase().includes('gcp')) {
    return {
      icon: <CloudCog className="h-5 w-5 text-blue-500" />,
      badge: { text: 'GCP', className: 'bg-blue-500/10 text-blue-500' },
    };
  }
  if (description.toLowerCase().includes('stripe')) {
    return {
      icon: <KeyRound className="h-5 w-5 text-purple-500" />,
      badge: { text: 'Stripe', className: 'bg-purple-500/10 text-purple-500' },
    };
  }
  if (description.toLowerCase().includes('slack')) {
    return {
      icon: <MessageSquare className="h-5 w-5 text-green-500" />,
      badge: { text: 'Slack', className: 'bg-green-500/10 text-green-500' },
    };
  }
  if (description.toLowerCase().includes('private key')) {
    return {
      icon: <KeyRound className="h-5 w-5 text-red-500" />,
      badge: { text: 'Private Key', className: 'bg-red-500/10 text-red-500' },
    };
  }
  return {
    icon: <ShieldAlert className="h-5 w-5 text-blue-500" />,
    badge: { text: 'Generic', className: 'bg-blue-500/10 text-blue-500' },
  };
};

const DescriptionSelect: React.FC<DescriptionSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchDescriptions = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}description/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type: type,
          },
        },
        (response: DescriptionResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setDescriptions(response.values);
            } else {
              setDescriptions((prev) => [...prev, ...response.values]);
            }
            setHasMore(descriptions.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setDescriptions([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, descriptions.length, type]
  );

  useEffect(() => {
    setPage(1);
    setDescriptions([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchDescriptions(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, page, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        document.querySelector('input')?.focus();
      }, 100);
    }
  }, [open]);

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

  const toggleDescription = (description: Description) => {
    const isSelected = value.some((v) => v.value === description.value);
    if (isSelected) {
      onChange(value.filter((v) => v.value !== description.value));
    } else {
      onChange([...value, description]);
    }
  };

  const removeDescription = (descToRemove: Description, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== descToRemove.value));
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
              value.map((description) => (
                <div key={description.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{description.label}</span>
                    <button
                      onClick={(e) => removeDescription(description, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select descriptions...</span>
            )}
          </div>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[400px] px-2">
            {descriptions.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No descriptions found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {descriptions.map((description) => {
                  const { icon, badge } = getDescriptionTypeInfo(description.value);
                  const isSelected = value.some((v) => v.value === description.value);
                  return (
                    <div
                      key={description.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleDescription(description)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-lg mt-1',
                          'flex items-center justify-center',
                          'bg-accent/50'
                        )}
                      >
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {badge && (
                            <Badge
                              variant="secondary"
                              className={cn('h-5 px-1.5', badge.className)}
                            >
                              {badge.text}
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
                        <div className="text-sm mt-1">{description.label}</div>
                      </div>

                      <div
                        className={cn(
                          'h-5 w-5 rounded-md border-2 flex-shrink-0 mt-1',
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

export default DescriptionSelect;
