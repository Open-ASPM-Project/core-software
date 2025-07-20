import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { GitFork, GitBranch, Star, Eye, GitPullRequest, Scale } from 'lucide-react';

interface GitlabRepoCardProps {
  repo: {
    id: number;
    name: string;
    author: string;
    score_normalized: number;
    repoUrl: string;
    created_at: string;
    other_repo_details: {
      description: string | null;
      name_with_namespace: string;
      visibility: string;
      default_branch: string;
      forks_count: number;
      star_count: number;
      avatar_url: string | null;
      web_url: string;
    };
  };
}

const GitlabRepoCard: React.FC<GitlabRepoCardProps> = ({ repo }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {repo.other_repo_details.avatar_url && (
                <img
                  src={repo.other_repo_details.avatar_url}
                  alt={repo.name}
                  className="w-8 h-8 rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                  <a
                    href={repo.other_repo_details.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.other_repo_details.name_with_namespace}
                  </a>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(repo.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={`capitalize ${
                  repo.other_repo_details.visibility === 'private'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                <Eye className="w-3 h-3 mr-1" />
                {repo.other_repo_details.visibility}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <GitBranch className="w-3 h-3 mr-1" />
                {repo.other_repo_details.default_branch}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              >
                <Scale className="w-3 h-3 mr-1" />
                Score: {Math.round(repo.score_normalized)}
              </Badge>
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
            <Star className="w-4 h-4" />
            <span>{repo.other_repo_details.star_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{repo.other_repo_details.forks_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitPullRequest className="w-4 h-4" />
            <a
              href={`${repo.other_repo_details.web_url}/-/merge_requests`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              View PRs
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GitlabRepoCard;
