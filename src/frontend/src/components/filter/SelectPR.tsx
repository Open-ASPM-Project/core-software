import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  Loader2,
  Github,
  Gitlab,
  GitPullRequest,
  Calendar,
  Link,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_BASE_URLS } from '@/config/api.config';

interface PR {
  pr_id: number;
  pr_name: string;
  repo_id: number;
  pr_link: string;
  vctype: 'github' | 'gitlab' | 'bitbucket';
  vc_id: number;
  webhook_id: number;
  last_scan: string | null;
  secret_count: number | null;
  vulnerability_count: number | null;
  id: number;
  created_at: string;
}

interface PRWithCounts {
  pr: PR;
  secret_count: number;
  vulnerability_count: number;
}

interface PRResponse {
  data: PRWithCounts[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface SelectPRProps {
  label?: string;
  placeholder?: string;
  selectedValues?: PR[];
  onSelectedChange: (prs: PR[]) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  commonAPIRequest?: any;
}

const getVCTypeIcon = (type: string): JSX.Element => {
  switch (type?.toLowerCase()) {
    case 'github':
      return <Github className="h-4 w-4 text-[#2088FF] dark:text-[#58a6ff]" />;
    case 'gitlab':
      return <Gitlab className="h-4 w-4 text-[#FC6D26] dark:text-[#fc6d26]" />;
    default:
      return <GitPullRequest className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const SelectPR: React.FC<SelectPRProps> = ({
  label,
  placeholder = 'Select pull requests...',
  selectedValues = [],
  onSelectedChange,
  error,
  disabled,
  className,
  commonAPIRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prs, setPrs] = useState<PR[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchPullRequests = useCallback(() => {
    if (loading) return;

    setLoading(true);
    commonAPIRequest(
      {
        api: `${API_BASE_URLS.development}/pr/`,
        method: 'GET',
        params: {
          search: searchQuery || undefined,
          page,
          limit: 10,
        },
      },
      (response: PRResponse) => {
        setLoading(false);
        if (response?.data) {
          const transformedData = response.data.map((item) => ({
            ...item.pr,
            secret_count: item.secret_count,
            vulnerability_count: item.vulnerability_count,
          }));
          if (page === 1) {
            setPrs(transformedData);
          } else {
            setPrs((prev) => [...prev, ...transformedData]);
          }
          setHasMore(response.current_page < response.total_pages);
        } else {
          if (page === 1) {
            setPrs([]);
          }
          setHasMore(false);
        }
      }
    );
  }, [commonAPIRequest, searchQuery, page, loading]);

  useEffect(() => {
    setPage(1);
    setPrs([]);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      fetchPullRequests();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchQuery, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
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

  const handleRemove = useCallback(
    (pr: PR, e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectedChange(selectedValues.filter((item) => item.id !== pr.id));
    },
    [selectedValues, onSelectedChange]
  );

  const handleSelect = useCallback(
    (pr: PR) => {
      const isSelected = selectedValues.some((selected) => selected.id === pr.id);
      if (isSelected) {
        onSelectedChange(selectedValues.filter((item) => item.id !== pr.id));
      } else {
        onSelectedChange([...selectedValues, pr]);
      }
    },
    [selectedValues, onSelectedChange]
  );

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <Button
        variant="outline"
        role="combobox"
        onClick={() => setOpen(true)}
        className={cn(
          'w-full justify-start h-auto min-h-[40px] py-2',
          !selectedValues.length && 'text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive',
          className
        )}
        disabled={disabled}
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.length > 0 ? (
            selectedValues.map((pr) => (
              <div key={pr.id} className="flex items-center">
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                  {getVCTypeIcon(pr.vctype)}
                  <span>{pr.pr_name}</span>
                  <div
                    role="button"
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                    onClick={(e) => handleRemove(pr, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search pull requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              <div className="p-4">
                {prs.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <GitPullRequest className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No pull requests found</p>
                    <p className="text-xs mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prs.map((pr) => {
                      const isSelected = selectedValues.some((selected) => selected.id === pr.id);
                      return (
                        <div
                          key={pr.id}
                          onClick={() => handleSelect(pr)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                            'transition-all duration-200',
                            isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getVCTypeIcon(pr.vctype)}
                              <span className="font-medium truncate">{pr.pr_name}</span>
                              {pr.secret_count > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 bg-amber-500/10 text-amber-500"
                                >
                                  {pr.secret_count} secrets
                                </Badge>
                              )}

                              {pr.vulnerability_count > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-1.5 bg-rose-500/10 text-rose-500"
                                >
                                  {pr.vulnerability_count} vulnerabilities
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(pr.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Link className="h-3 w-3" />
                                <a
                                  href={pr.pr_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline text-blue-500"
                                >
                                  View PR
                                </a>
                              </div>
                              {pr.last_scan && (
                                <div className="flex items-center gap-1.5">
                                  <ShieldAlert className="h-3 w-3" />
                                  <span>Last Scanned: {formatDate(pr.last_scan)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            className={cn(
                              'h-5 w-5 rounded-md border-2',
                              'flex items-center justify-center',
                              'transition-colors duration-200',
                              isSelected
                                ? 'bg-blue-400 border-blue-400 text-white dark:bg-blue-500 dark:border-blue-500'
                                : 'border-input hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
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
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default withAPIRequest(SelectPR);
