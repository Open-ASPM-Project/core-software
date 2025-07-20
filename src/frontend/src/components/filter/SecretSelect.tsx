import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Key, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface Secret {
  value: string;
  label: string;
}

interface SecretResponse {
  values: Secret[];
  total: number;
}

interface SecretSelectProps {
  label: string;
  value: Secret[];
  onChange: (secrets: Secret[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const getSecretTypeInfo = (secret: string) => {
  if (secret.includes('encrypted_')) {
    return {
      icon: <Key className="h-5 w-5 text-amber-500" />,
      badge: { text: 'Encrypted', className: 'bg-amber-500/10 text-amber-500' },
    };
  }
  if (secret.includes('=')) {
    return {
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      badge: { text: 'Plain Text', className: 'bg-red-500/10 text-red-500' },
    };
  }
  return {
    icon: <Key className="h-5 w-5 text-blue-500" />,
    badge: { text: 'Generic', className: 'bg-blue-500/10 text-blue-500' },
  };
};

const SecretSelect: React.FC<SecretSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchSecrets = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}secret/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type: type,
          },
        },
        (response: SecretResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setSecrets(response.values);
            } else {
              setSecrets((prev) => [...prev, ...response.values]);
            }
            setHasMore(secrets.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setSecrets([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, secrets.length, type]
  );

  useEffect(() => {
    setPage(1);
    setSecrets([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchSecrets(searchQuery), 300);
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

  const toggleSecret = (secret: Secret) => {
    const isSelected = value.some((v) => v.value === secret.value);
    if (isSelected) {
      onChange(value.filter((v) => v.value !== secret.value));
    } else {
      onChange([...value, secret]);
    }
  };

  const removeSecret = (secretToRemove: Secret, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== secretToRemove.value));
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
              value.map((secret) => (
                <div key={secret.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <Key className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{secret.label}</span>
                    <button
                      onClick={(e) => removeSecret(secret, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select secrets...</span>
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
                placeholder="Search secrets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[400px] px-2">
            {secrets.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No secrets found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {secrets.map((secret) => {
                  const { icon, badge } = getSecretTypeInfo(secret.value);
                  const isSelected = value.some((v) => v.value === secret.value);
                  return (
                    <div
                      key={secret.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleSecret(secret)}
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
                          <Badge variant="secondary" className={cn('h-5 px-1.5', badge.className)}>
                            {badge.text}
                          </Badge>
                          {isSelected && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm mt-1">{secret.label}</div>
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

export default SecretSelect;
