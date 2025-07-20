import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  GitFork,
  Star,
  Eye,
  GitBranch,
  Scale,
  BookOpen,
  MessageCircle,
  GitPullRequest,
  Scale3d,
} from 'lucide-react';

interface GithubRepoCardProps {
  repo: {
    id: number;
    name: string;
    author: string;
    score_normalized: number;
    repoUrl: string;
    created_at: string;
    other_repo_details: {
      full_name: string;
      private: boolean;
      description: string;
      fork: boolean;
      html_url: string;
      homepage: string;
      language: string;
      topics: string[];
      visibility: string;
      forks_count: number;
      stargazers_count: number;
      watchers_count: number;
      open_issues_count: number;
      has_discussions: boolean;
      license: {
        name: string;
      } | null;
      owner: {
        avatar_url: string;
      };
      default_branch: string;
      size: number;
    };
  };
}

const GithubRepoCard: React.FC<GithubRepoCardProps> = ({ repo }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img
                src={repo.other_repo_details.owner.avatar_url}
                alt={repo.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                  <a
                    href={repo.other_repo_details.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.other_repo_details.full_name}
                  </a>
                </h3>
                {repo.other_repo_details.homepage && (
                  <a
                    href={repo.other_repo_details.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {repo.other_repo_details.homepage}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={`capitalize ${
                  repo.other_repo_details.private
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                <Eye className="w-3 h-3 mr-1" />
                {repo.other_repo_details.visibility}
              </Badge>

              {repo.other_repo_details.fork && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <GitFork className="w-3 h-3 mr-1" />
                  Fork
                </Badge>
              )}

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

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{repo.other_repo_details.stargazers_count}</span>
          </div>

          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{repo.other_repo_details.forks_count}</span>
          </div>

          <div className="flex items-center gap-1">
            <GitPullRequest className="w-4 h-4" />
            <span>{repo.other_repo_details.open_issues_count} Issues</span>
          </div>

          {repo.other_repo_details.has_discussions && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>Discussions</span>
            </div>
          )}

          {repo.other_repo_details.license && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{repo.other_repo_details.license.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Scale3d className="w-4 h-4" />
            <span>{(repo.other_repo_details.size / 1024).toFixed(2)} MB</span>
          </div>
        </div>

        {repo.other_repo_details.topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {repo.other_repo_details.topics.map((topic) => (
              <Badge key={topic} variant="secondary" className="bg-muted">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GithubRepoCard;
