import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface Email {
  value: string;
  label: string;
}

interface EmailResponse {
  values: Email[];
  total: number;
}

interface EmailSelectProps {
  label: string;
  value: Email[];
  onChange: (emails: Email[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const EmailSelect: React.FC<EmailSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchEmails = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}email/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type: type,
          },
        },
        (response: EmailResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setEmails(response.values);
            } else {
              setEmails((prev) => [...prev, ...response.values]);
            }
            setHasMore(emails.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setEmails([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, emails.length, type]
  );

  useEffect(() => {
    setPage(1);
    setEmails([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchEmails(searchQuery), 300);
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

  const toggleEmail = (email: Email) => {
    const isSelected = value.some((e) => e.value === email.value);
    if (isSelected) {
      onChange(value.filter((e) => e.value !== email.value));
    } else {
      onChange([...value, email]);
    }
  };

  const removeEmail = (emailToRemove: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((e) => e.value !== emailToRemove.value));
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
              value.map((email) => (
                <div key={email.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{email.label}</span>
                    <button
                      onClick={(e) => removeEmail(email, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select emails...</span>
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
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {emails.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No emails found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {emails.map((email) => {
                  const isSelected = value.some((e) => e.value === email.value);
                  return (
                    <div
                      key={email.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleEmail(email)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full',
                          'flex items-center justify-center',
                          'bg-accent/50',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <Mail className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{email.label}</span>
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
                          <Mail className="h-3 w-3" />
                          <span>{email.value}</span>
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

export default EmailSelect;
