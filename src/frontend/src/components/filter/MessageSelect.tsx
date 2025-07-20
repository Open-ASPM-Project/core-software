import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Loader2,
  Search,
  MessageSquare,
  X,
  GitCommit,
  GitPullRequest,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URLS } from '@/config/api.config';
import { ScrollArea } from '../ui/scroll-area';

interface Message {
  value: string;
  label: string;
}

interface MessageResponse {
  values: Message[];
  total: number;
}

interface MessageSelectProps {
  label: string;
  value: Message[];
  onChange: (messages: Message[]) => void;
  commonAPIRequest: <T>(config: any, callback: (response: T) => void) => void;
  path: string;
  type: 'secret' | 'vulnerability';
}

const getMessageTypeInfo = (
  message: string
): { icon: JSX.Element; badge?: { text: string; className: string } } => {
  if (message.toLowerCase().includes('merge pull request')) {
    return {
      icon: <GitPullRequest className="h-5 w-5 text-purple-500" />,
      badge: { text: 'Merge', className: 'bg-purple-500/10 text-purple-500' },
    };
  }
  if (message.includes(':robot:') || message.toLowerCase().includes('auto generated')) {
    return {
      icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
      badge: { text: 'Auto', className: 'bg-blue-500/10 text-blue-500' },
    };
  }
  return {
    icon: <GitCommit className="h-5 w-5 text-green-500" />,
  };
};

const formatMessage = (message: string): { title: string; description?: string } => {
  const parts = message.split('\n\n');
  return {
    title: parts[0],
    description: parts.length > 1 ? parts.slice(1).join('\n\n') : undefined,
  };
};

const MessageSelect: React.FC<MessageSelectProps> = ({
  label,
  value,
  onChange,
  commonAPIRequest,
  path,
  type,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchMessages = useCallback(
    (query: string) => {
      if (loading) return;
      setLoading(true);

      commonAPIRequest(
        {
          api: `${API_BASE_URLS.development}${path}message/values`,
          method: 'GET',
          params: {
            search: query || undefined,
            page,
            page_size: pageSize,
            type: type,
          },
        },
        (response: MessageResponse) => {
          setLoading(false);
          if (response?.values) {
            if (page === 1) {
              setMessages(response.values);
            } else {
              setMessages((prev) => [...prev, ...response.values]);
            }
            setHasMore(messages.length + response.values.length < response.total);
          } else {
            if (page === 1) {
              setMessages([]);
            }
            setHasMore(false);
          }
        }
      );
    },
    [commonAPIRequest, path, page, loading, messages.length, type]
  );

  useEffect(() => {
    setPage(1);
    setMessages([]);
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchMessages(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, page, open, fetchMessages]);

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

  const toggleMessage = (message: Message) => {
    const isSelected = value.some((m) => m.value === message.value);
    if (isSelected) {
      onChange(value.filter((m) => m.value !== message.value));
    } else {
      onChange([...value, message]);
    }
  };

  const removeMessage = (messageToRemove: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((m) => m.value !== messageToRemove.value));
  };

  return (
    <>
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
            value.map((message) => (
              <div key={message.value} className="flex items-center">
                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                  <MessageSquare className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">
                    {formatMessage(message.label).title}
                  </span>
                  <button
                    onClick={(e) => removeMessage(message, e)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <span>Select messages...</span>
          )}
        </div>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] p-0 [&>button]:hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="h-[400px] px-2">
            {messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No messages found</p>
                <p className="text-xs mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div>
                {messages.map((message) => {
                  const { icon, badge } = getMessageTypeInfo(message.value);
                  const { title, description } = formatMessage(message.value);
                  const isSelected = value.some((m) => m.value === message.value);
                  return (
                    <div
                      key={message.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg cursor-pointer mb-2',
                        'transition-all duration-200',
                        isSelected ? 'bg-accent/70 hover:bg-accent/80' : 'hover:bg-accent/50'
                      )}
                      onClick={() => toggleMessage(message)}
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
                          <span className="font-medium">{title}</span>
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
                        {description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {description}
                          </div>
                        )}
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

export default MessageSelect;
