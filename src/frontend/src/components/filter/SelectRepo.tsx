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
  GitFork,
  User,
  Shield,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { SelectRepoProps, Repository, RepoResponse } from './types';
import { API_BASE_URLS } from '@/config/api.config';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SelectRepoBase: React.FC<SelectRepoProps> = ({
  label,
  placeholder = 'Select repositories...',
  selectedValues = [],
  onSelectedChange,
  error,
  disabled,
  className,
  commonAPIRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchRepositories = useCallback(() => {
    if (loading) return;

    setLoading(true);
    commonAPIRequest<RepoResponse>(
      {
        api: `${API_BASE_URLS.development}/repo/`,
        method: 'GET',
        params: {
          page,
          search: searchQuery || undefined,
          limit: 10,
        },
      },
      (response) => {
        setLoading(false);
        if (response?.data) {
          if (page === 1) {
            setRepos(response.data);
          } else {
            setRepos((prev) => [...prev, ...response.data]);
          }
          setHasMore(response.current_page < response.total_pages);
        } else {
          if (page === 1) {
            setRepos([]);
          }
          setHasMore(false);
        }
      }
    );
  }, [commonAPIRequest, searchQuery, page, loading]);

  useEffect(() => {
    setPage(1);
    setRepos([]);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      fetchRepositories();
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

  const handleSelect = useCallback(
    (repo: Repository) => {
      const isSelected = selectedValues.some((selected) => selected.id === repo.id);
      if (isSelected) {
        onSelectedChange(selectedValues.filter((selected) => selected.id !== repo.id));
      } else {
        onSelectedChange([...selectedValues, repo]);
      }
    },
    [selectedValues, onSelectedChange]
  );

  const removeSelected = useCallback(
    (repo: Repository, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelectedChange(selectedValues.filter((r) => r.id !== repo.id));
    },
    [selectedValues, onSelectedChange]
  );

  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="text-sm font-medium text-foreground">{label}</Label>}
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
        <div className="flex flex-wrap gap-1.5 px-1 flex-1">
          {selectedValues.length > 0 ? (
            selectedValues.map((repo) => (
              <div key={repo.id} className="flex items-center">
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                  <GitFork className="h-3 w-3" />
                  <span>{repo.name}</span>
                  <div
                    role="button"
                    tabIndex={0}
                    data-remove-button
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                    onClick={(e) => removeSelected(repo, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        removeSelected(repo, e as any);
                      }
                    }}
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
          <div className="p-2 pb-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              {repos.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <GitFork className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No repositories found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="p-2">
                  {repos.map((repo) => {
                    const isSelected = selectedValues.some((selected) => selected.id === repo.id);
                    return (
                      <div
                        key={repo.id}
                        onClick={() => handleSelect(repo)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                          'transition-all duration-200',
                          isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg',
                            'flex items-center justify-center',
                            'bg-accent/50',
                            repo.secrets_count > 0 ? 'text-amber-500' : 'text-green-500'
                          )}
                        >
                          {repo.secrets_count > 0 ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <Shield className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{repo.name}</span>
                            <a
                              href={repo.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{repo.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(repo.lastScanDate)}</span>
                            </div>
                            {repo.secrets_count > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 bg-amber-500/10 text-amber-500"
                              >
                                {repo.secrets_count} secrets
                              </Badge>
                            )}
                            {repo.vulnerability_count > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 bg-rose-500/10 text-rose-500"
                              >
                                {repo.vulnerability_count} vulnerabilities
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export const SelectRepo = withAPIRequest(SelectRepoBase);
