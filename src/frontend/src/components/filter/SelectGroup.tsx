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
  Users,
  User,
  Shield,
  CheckCircle2,
  Calendar,
  Folder,
  BarChart,
  FolderArchive,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_BASE_URLS } from '@/config/api.config';

interface Group {
  id: number;
  name: string;
  description: string;
  active: boolean;
  repo_count: number;
  created_on: string;
  score_normalized: number;
}

interface GroupResponse {
  data: Group[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface SelectGroupProps {
  label?: string;
  placeholder?: string;
  selectedValues?: Group[];
  onSelectedChange: (groups: Group[]) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  commonAPIRequest?: <T>(
    config: {
      api: string;
      method: string;
      params?: Record<string, unknown>;
      data?: Record<string, unknown>;
    },
    callback: (response: T | null) => void
  ) => void;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const SelectGroupBase: React.FC<SelectGroupProps> = ({
  label,
  placeholder = 'Select groups...',
  selectedValues = [],
  onSelectedChange,
  error,
  disabled,
  className,
  commonAPIRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchGroups = useCallback(() => {
    if (loading) return;

    setLoading(true);
    commonAPIRequest<GroupResponse>(
      {
        api: `${API_BASE_URLS.development}/groups/`,
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
            setGroups(response.data);
          } else {
            setGroups((prev) => [...prev, ...response.data]);
          }
          setHasMore(response.current_page < response.total_pages);
        } else {
          if (page === 1) {
            setGroups([]);
          }
          setHasMore(false);
        }
      }
    );
  }, [commonAPIRequest, searchQuery, page, loading]);

  useEffect(() => {
    setPage(1);
    setGroups([]);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      fetchGroups();
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
    (group: Group) => {
      const isSelected = selectedValues.some((selected) => selected.id === group.id);
      if (isSelected) {
        onSelectedChange(selectedValues.filter((selected) => selected.id !== group.id));
      } else {
        onSelectedChange([...selectedValues, group]);
      }
    },
    [selectedValues, onSelectedChange]
  );

  const removeSelected = useCallback(
    (group: Group, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelectedChange(selectedValues.filter((g) => g.id !== group.id));
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
            selectedValues.map((group) => (
              <div key={group.id} className="flex items-center">
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                  <Users className="h-3 w-3" />
                  <span>{group.name}</span>
                  <div
                    role="button"
                    tabIndex={0}
                    data-remove-button
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                    onClick={(e) => removeSelected(group, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        removeSelected(group, e as any);
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
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              {groups.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No groups found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="p-2">
                  {groups.map((group) => {
                    const isSelected = selectedValues.some((selected) => selected.id === group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => handleSelect(group)}
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
                            group.score_normalized > 50 ? 'text-amber-500' : 'text-green-500'
                          )}
                        >
                          <FolderArchive className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{group.name}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'h-5 px-1.5',
                                group.score_normalized > 50
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-green-500/10 text-green-500'
                              )}
                            >
                              Score: {Math.round(group.score_normalized)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Folder className="h-3 w-3" />
                              <span>{group.repo_count} repositories</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(group.created_on)}</span>
                            </div>
                          </div>

                          {group.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                              {group.description}
                            </p>
                          )}
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

export const SelectGroups = withAPIRequest(SelectGroupBase);
