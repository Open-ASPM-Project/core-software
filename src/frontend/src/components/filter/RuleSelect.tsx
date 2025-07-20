import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Search, Shield, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface Rule {
  value: string;
  label: string;
}

interface RuleResponse {
  values: Rule[];
  total: number;
}

interface RuleSelectProps {
  label: string;
  value: Rule[];
  onChange: (rules: Rule[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const getRuleIcon = (rule: string): JSX.Element => {
  switch (rule) {
    case 'private-key':
      return <Shield className="h-5 w-5 text-red-500" />;
    case 'github-pat':
    case 'aws-access-token':
    case 'stripe-access-token':
      return <Shield className="h-5 w-5 text-amber-500" />;
    default:
      return <Shield className="h-5 w-5 text-blue-500" />;
  }
};

const getRuleBadge = (rule: string): { text: string; className: string } => {
  switch (rule) {
    case 'private-key':
      return { text: 'Critical', className: 'bg-red-500/10 text-red-500' };
    case 'github-pat':
    case 'aws-access-token':
    case 'stripe-access-token':
      return { text: 'High', className: 'bg-amber-500/10 text-amber-500' };
    default:
      return { text: 'Medium', className: 'bg-blue-500/10 text-blue-500' };
  }
};

const RuleSelect: React.FC<RuleSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchRules = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}rule/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type: type,
          },
        },
        (response: RuleResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setRules(response.values);
            } else {
              setRules((prev) => [...prev, ...response.values]);
            }
            setHasMore(rules.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setRules([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, rules.length, type]
  );

  useEffect(() => {
    setPage(1);
    setRules([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchRules(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, page, open, fetchRules]);

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

  const toggleRule = (rule: Rule) => {
    const isSelected = value.some((v) => v.value === rule.value);
    if (isSelected) {
      onChange(value.filter((v) => v.value !== rule.value));
    } else {
      onChange([...value, rule]);
    }
  };

  const removeRule = (ruleToRemove: Rule, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== ruleToRemove.value));
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
              value.map((rule) => (
                <div key={rule.value} className="flex items-center">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    {getRuleIcon(rule.value)}
                    <span>{rule.label}</span>
                    <button
                      onClick={(e) => removeRule(rule, e)}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <span>Select rules...</span>
            )}
          </div>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[500px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] px-2">
            {rules.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No rules found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {rules.map((rule) => {
                  const badge = getRuleBadge(rule.value);
                  const isSelected = value.some((v) => v.value === rule.value);
                  return (
                    <div
                      key={rule.value}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleRule(rule)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-lg',
                          'flex items-center justify-center',
                          'bg-accent/50'
                        )}
                      >
                        {getRuleIcon(rule.value)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{rule.label}</span>
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
                          <Shield className="h-3 w-3" />
                          <span>{rule.value}</span>
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

export default RuleSelect;
