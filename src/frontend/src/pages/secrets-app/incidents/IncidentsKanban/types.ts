interface Repository {
  id: number;
  name: string;
  repoUrl: string;
  author: string;
  vctype: string;
  score_normalized: number;
  lastScanDate: string;
  created_at: string;
  updated_at: string;
  other_repo_details: {
    description: string;
    language: string | null;
    visibility: string;
    default_branch: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    license: {
      name: string;
    } | null;
    created_at: string;
    updated_at: string;
    size: number;
  };
}

export interface SecurityIncident {
  id: number;
  name: string;
  status: 'open' | 'in-progress' | 'closed';
  type: string;
  created_at: string;
  updated_at: string;
  closed_by: string | null;
  secret: {
    rule: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    file: string;
    author: string;
    commit: string;
    score_normalized: number;
    repository_id: number;
    secret: string;
    id: number;
    repository: Repository;
  };
  repository: {
    repoUrl: string;
    name: string;
    full_name: string;
    author: string;
    id: number;
  };
}

export interface SecurityColumn {
  id: string;
  title: string;
  items: SecurityIncident[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  total_pages: number;
  current_limit: number;
  total_count: number;
}
