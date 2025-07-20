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
  Globe,
  User,
  ShieldCheck,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { withAPIRequest } from '@/hoc/withApiRequest';
import { API_BASE_URLS } from '@/config/api.config';

// Keep all your existing interfaces and types
type VCType = 'github' | 'gitlab' | 'bitbucket';

interface VersionControl {
  id: number;
  name: string;
  description: string;
  type: VCType;
  token: string;
  url: string;
  added_by_user_id: number;
  created_by: number;
  updated_by: number;
  active: boolean;
}

interface VCResponse {
  data: VersionControl[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}

interface SelectVCProps {
  label?: string;
  placeholder?: string;
  selectedValues?: VersionControl[];
  onSelectedChange: (vcs: VersionControl[]) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const getVCTypeDetails = (type: VCType): { icon: JSX.Element; color: string } => {
  switch (type?.toLowerCase()) {
    case 'github':
      return {
        icon: <Github className="h-4 w-4" />,
        color: 'text-[#2088FF] dark:text-[#58a6ff]',
      };
    case 'gitlab':
      return {
        icon: <Gitlab className="h-4 w-4" />,
        color: 'text-[#FC6D26] dark:text-[#fc6d26]',
      };
    default:
      return {
        icon: <Globe className="h-4 w-4" />,
        color: 'text-blue-500 dark:text-blue-400',
      };
  }
};

const SelectVCBase: React.FC<SelectVCProps> = ({
  label,
  placeholder = 'Select version controls...',
  selectedValues = [],
  onSelectedChange,
  error,
  disabled,
  className,
  commonAPIRequest,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vcs, setVcs] = useState<VersionControl[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchVersionControls = useCallback(() => {
    if (loading) return;

    setLoading(true);

    commonAPIRequest<VCResponse>(
      {
        api: `${API_BASE_URLS.development}/vc/`,
        method: 'GET',
        params: {
          page,
          vc_name: searchQuery || undefined,
          limit: 10,
        },
      },
      (response: {
        data: React.SetStateAction<VersionControl[]>;
        current_page: number;
        total_pages: number;
      }) => {
        setLoading(false);

        if (response?.data) {
          if (page === 1) {
            setVcs(response.data);
          } else {
            setVcs((prev) => [...prev, ...response.data]);
          }
          setHasMore(response.current_page < response.total_pages);
        } else {
          if (page === 1) {
            setVcs([]);
          }
          setHasMore(false);
        }
      }
    );
  }, [commonAPIRequest, searchQuery, page, loading]);

  useEffect(() => {
    setPage(1);
    setVcs([]);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      fetchVersionControls();
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
    (vc: VersionControl) => {
      const isSelected = selectedValues.some((selected) => selected.id === vc.id);
      if (isSelected) {
        onSelectedChange(selectedValues.filter((selected) => selected.id !== vc.id));
      } else {
        onSelectedChange([...selectedValues, vc]);
      }
    },
    [selectedValues, onSelectedChange]
  );

  const removeSelected = useCallback(
    (vc: VersionControl, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelectedChange(selectedValues.filter((item) => item.id !== vc.id));
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
            selectedValues.map((vc) => {
              const { icon, color } = getVCTypeDetails(vc.type);
              return (
                <div key={vc.id} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <span className={color}>{icon}</span>
                    <span>{vc.name}</span>
                    <div
                      role="button"
                      data-remove-button
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                      onClick={(e) => removeSelected(vc, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })
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
                placeholder="Search version controls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              {vcs.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No version controls found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="p-2">
                  {vcs.map((vc) => {
                    const { icon, color } = getVCTypeDetails(vc.type);
                    const isSelected = selectedValues.some((selected) => selected.id === vc.id);

                    return (
                      <div
                        key={vc.id}
                        onClick={() => handleSelect(vc)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                          'transition-all duration-200',
                          isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-full',
                            'flex items-center justify-center',
                            'bg-accent/50'
                          )}
                        >
                          <span className={color}>{icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{vc.name}</span>
                            {vc.active && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 bg-success/10 text-success-foreground"
                              >
                                Active
                              </Badge>
                            )}
                          </div>

                          {vc.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {vc.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>ID: {vc.added_by_user_id}</span>
                            </div>
                            {vc.active ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                                <span>Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Shield className="h-3 w-3 text-yellow-500" />
                                <span>Inactive</span>
                              </div>
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
                                ? 'bg-blue-400 border-blue-400 text-white dark:bg-blue-500 dark:border-blue-500'
                                : 'border-input hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
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

export const SelectVC = withAPIRequest(SelectVCBase);
