import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, User, CalendarClock } from 'lucide-react';

interface Comment {
  comment: string;
  id: number;
  created_by: number;
  created_on: string;
}

interface AllowListCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  allowListName: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

const AllowListCommentsDialog: React.FC<AllowListCommentsDialogProps> = ({
  open,
  onOpenChange,
  comments,
  allowListName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col p-0">
        <DialogHeader
          className="p-6 rounded-t-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 
          dark:from-emerald-600/20 dark:to-blue-600/20 
          border-b border-emerald-100 dark:border-emerald-800/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl mb-1">Allow List Comments</DialogTitle>
              <DialogDescription>
                View comment history for allowlist:
                <p className="font-medium text-primary/90 max-w-[48ch] truncate">{allowListName}</p>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow px-1 p-6">
          <div className="space-y-6 py-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                  <MessageCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No comments yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no comments on this allowlist yet.
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="group relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-12 -bottom-2 w-px bg-slate-200 dark:bg-slate-700 last:hidden" />

                  {/* Avatar & Content Container */}
                  <div className="flex gap-4">
                    {/* User Avatar */}
                    <div className="relative mt-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/50 dark:to-blue-900/50 border border-slate-200/50 dark:border-slate-700/50">
                        <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-x-2">
                        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            User {comment.created_by}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          {formatDate(comment.created_on)}
                        </div>
                      </div>

                      {/* Comment Text */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AllowListCommentsDialog;
