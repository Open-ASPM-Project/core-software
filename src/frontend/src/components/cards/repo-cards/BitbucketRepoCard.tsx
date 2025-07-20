import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { GitFork, GitBranch, Lock, Unlock, Scale, GitPullRequest } from 'lucide-react';

interface BitbucketRepoCardProps {
  repo: {
    id: number;
    name: string;
    author: string;
    score_normalized: number;
    repoUrl: string;
    created_at: string;
    other_repo_details: {
      full_name: string;
      description: string;
      is_private: boolean;
      created_on: string;
      updated_on: string;
      size: number;
      language: string;
      mainbranch: {
        name: string;
      };
      links: {
        html: { href: string };
        avatar: { href: string };
        pullrequests: { href: string };
      };
    };
  };
}

const BitbucketRepoCard: React.FC<BitbucketRepoCardProps> = ({ repo }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img
                src={repo.other_repo_details.links.avatar.href}
                alt={repo.name}
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                  <a
                    href={repo.other_repo_details.links.html.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.other_repo_details.full_name}
                  </a>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Updated {format(new Date(repo.other_repo_details.updated_on), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={`capitalize ${
                  repo.other_repo_details.is_private
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {repo.other_repo_details.is_private ? (
                  <Lock className="w-3 h-3 mr-1" />
                ) : (
                  <Unlock className="w-3 h-3 mr-1" />
                )}
                {repo.other_repo_details.is_private ? 'Private' : 'Public'}
              </Badge>

              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <GitBranch className="w-3 h-3 mr-1" />
                {repo.other_repo_details.mainbranch.name}
              </Badge>

              <Badge
                variant="secondary"
                className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              >
                <Scale className="w-3 h-3 mr-1" />
                Score: {Math.round(repo.score_normalized)}
              </Badge>

              {repo.other_repo_details.language && (
                <Badge variant="outline">{repo.other_repo_details.language}</Badge>
              )}
            </div>
          </div>
        </div>

        {repo.other_repo_details.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {repo.other_repo_details.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            <span>{(repo.other_repo_details.size / 1024).toFixed(1)}KB</span>
          </div>

          <div className="flex items-center gap-1">
            <GitPullRequest className="w-4 h-4" />
            <a
              href={repo.other_repo_details.links.pullrequests.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              View PRs
            </a>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs">
              Created {format(new Date(repo.other_repo_details.created_on), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BitbucketRepoCard;
