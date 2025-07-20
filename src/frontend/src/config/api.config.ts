// HTTP Methods type
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type Environment = 'development' | 'staging' | 'production';
// type Environment = 'development';
// Environment-specific base URLs
export const API_BASE_URLS: Record<Environment, string> = {
  development: import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : process.env.VITE_API_BASE_URL,
  staging: import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : process.env.VITE_API_BASE_URL,
  production: import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : process.env.VITE_API_BASE_URL,
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  if (typeof window !== 'undefined') {
    const env = import.meta?.env?.MODE || 'development';
    return env as Environment;
  }
  return 'development';
};

// Get current base URL based on environment
export const getCurrentBaseUrl = (): string => {
  const env = getCurrentEnvironment();
  return API_BASE_URLS[env];
};

// Interface for endpoint configuration
interface EndpointConfig {
  path: string;
  method: HTTPMethod;
  requiresAuth: boolean;
}

// Interface for API endpoints
interface ApiEndpoints {
  auth: {
    login: EndpointConfig;
    register: EndpointConfig;
    logout: EndpointConfig;
    refreshToken: EndpointConfig;
    firstLogin: EndpointConfig;
    resetPasswordFirstLogin: EndpointConfig;
    resetPassword: EndpointConfig;
    validateLicense: EndpointConfig;
    requestLicense: EndpointConfig;
    licenseValidateOTP: EndpointConfig;
    checkEula: EndpointConfig;
    validateEula: EndpointConfig;
  };
  incidentsDashboard: {
    getIncidentsTrend: EndpointConfig;
    getSeverityBreakdown: EndpointConfig;
    getIncidents: EndpointConfig;
  };
  assetsDashboard: {
    getAssets: EndpointConfig;
    getRepoSplit: EndpointConfig;
  };
  repository: {
    getRepository: EndpointConfig;
    getRepositoryFilterCategories: EndpointConfig;
    getRepositoryProperties: EndpointConfig;
    deleteRepositoryProperty: EndpointConfig;
    getRepositoryPropertyValue: EndpointConfig;
    updateRepositoryPropertyValue: EndpointConfig;
    getRepositorySecrets: EndpointConfig;
    getRepositoryVulnerabilities: EndpointConfig;
    getRepositoryDetails: EndpointConfig;
    getRepositorySBOM: EndpointConfig;
  };
  group: {
    getGroups: EndpointConfig;
    addGroup: EndpointConfig;
    updateGroup: EndpointConfig;
    deleteGroup: EndpointConfig;
    getGroupDetails: EndpointConfig;
    getGroupRepositories: EndpointConfig;
  };
  prScans: {
    getPRScans: EndpointConfig;
  };
  commitScans: {
    getCommitScans: EndpointConfig;
    getCommitScanSecrets: EndpointConfig;
  };
  secrets: {
    getSecrets: EndpointConfig;
    getSecretDetails: EndpointConfig;
    getSecretRepositories: EndpointConfig;
  };
  allowList: {
    getAllowList: EndpointConfig;
    addAllowList: EndpointConfig;
    updateAllowList: EndpointConfig;
  };
  incidents: {
    getIncidents: EndpointConfig;
    getOpenIncidents: EndpointConfig;
    getInProgressIncidents: EndpointConfig;
    getClosedIncidents: EndpointConfig;
    updateIncidentStatus: EndpointConfig;
    getIncidentDetails: EndpointConfig;
    updateIncidentSeverity: EndpointConfig;
    getActivity: EndpointConfig;
    getComments: EndpointConfig;
    addComment: EndpointConfig;
    bulkUpdateStatus: EndpointConfig;
    getStats: EndpointConfig;
  };

  vulnerabilities: {
    getVulnerabilities: EndpointConfig;
    getVulnerabilityDetails: EndpointConfig;
    getUniqueVulnerabilities: EndpointConfig;
    getVulnerabilityRepositories: EndpointConfig;
  };

  // VM
  vm: {
    getAssets: EndpointConfig;
    getAssetsFiltersValues: EndpointConfig;
  };

  // Settings
  vcs: {
    getVcs: EndpointConfig;
    addVcs: EndpointConfig;
    deleteVcs: EndpointConfig;
    updateVcs: EndpointConfig;
    createWebhook: EndpointConfig;
    updateWebhook: EndpointConfig;
    getWebhookConfig: EndpointConfig;
  };

  sources: {
    getSources: EndpointConfig;
    addCloudSources: EndpointConfig;
    editCloudSources: EndpointConfig;
    deleteCloudSources: EndpointConfig;
    getCloudProviders: EndpointConfig;
  };

  integrations: {
    getSlackConfig: EndpointConfig;
    updateSlackConfig: EndpointConfig;
    getJiraConfig: EndpointConfig;
    updateJiraConfig: EndpointConfig;
    addSlackConfig: EndpointConfig;
    addJiraConfig: EndpointConfig;
  };
  users: {
    getUsers: EndpointConfig;
    createUser: EndpointConfig;
    deleteUser: EndpointConfig;
    updateUser: EndpointConfig;
    getUserDetail: EndpointConfig;
  };

  sso: {
    getConfigs: EndpointConfig;
    createConfig: EndpointConfig;
    getSSOProviders: EndpointConfig;
    initiateSSO: EndpointConfig;
    exchangeSSO: EndpointConfig;
    deleteConfig: EndpointConfig;
    updateConfig: EndpointConfig;
  };
}

// API Endpoints configuration
export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: {
      path: '/auth/login',
      method: 'POST',
      requiresAuth: false,
    },
    register: {
      path: '/auth/register',
      method: 'POST',
      requiresAuth: false,
    },
    logout: {
      path: '/auth/logout',
      method: 'POST',
      requiresAuth: true,
    },
    refreshToken: {
      path: '/auth/refresh-token',
      method: 'POST',
      requiresAuth: true,
    },
    firstLogin: {
      path: '/auth/first-login',
      method: 'GET',
      requiresAuth: false,
    },
    resetPasswordFirstLogin: {
      path: '/auth/first-login/reset_password',
      method: 'POST',
      requiresAuth: false,
    },
    resetPassword: {
      path: '/auth/reset-password/',
      method: 'POST',
      requiresAuth: false,
    },
    validateLicense: {
      path: '/license/validate',
      method: 'GET',
      requiresAuth: false,
    },
    requestLicense: {
      path: '/license/generate',
      method: 'POST',
      requiresAuth: false,
    },
    licenseValidateOTP: {
      path: '/license/verify',
      method: 'POST',
      requiresAuth: false,
    },
    checkEula: {
      path: '/v2/user-auth/eula',
      method: 'GET',
      requiresAuth: false,
    },
    validateEula: {
      path: '/v2/user-auth/eula',
      method: 'POST',
      requiresAuth: false,
    },
  },
  incidentsDashboard: {
    getIncidentsTrend: {
      path: '/incident/dashboard/incidents/trend',
      method: 'GET',
      requiresAuth: true,
    },
    getSeverityBreakdown: {
      path: '/incident/dashboard/incidents/severity_split',
      method: 'GET',
      requiresAuth: true,
    },
    getIncidents: {
      path: '/incident/',
      method: 'POST',
      requiresAuth: true,
    },
  },

  assetsDashboard: {
    getAssets: {
      path: '/incident/dashboard/incidents/top-repos',
      method: 'GET',
      requiresAuth: true,
    },
    getRepoSplit: {
      path: '/incident/dashboard/incidents/repo-split',
      method: 'GET',
      requiresAuth: true,
    },
  },
  repository: {
    getRepository: {
      path: '/repo/',
      method: 'GET',
      requiresAuth: true,
    },
    getRepositoryFilterCategories: {
      path: '/repo/filters/',
      method: 'GET',
      requiresAuth: true,
    },
    getRepositoryProperties: {
      path: '/repo/property/repository/',
      method: 'GET',
      requiresAuth: true,
    },
    deleteRepositoryProperty: {
      path: '/repo/property/repository/',
      method: 'DELETE',
      requiresAuth: true,
    },
    getRepositoryPropertyValue: {
      path: '/repo/property/',
      method: 'GET',
      requiresAuth: true,
    },
    updateRepositoryPropertyValue: {
      path: '/repo/property/repository/',
      method: 'POST',
      requiresAuth: true,
    },
    getRepositorySecrets: {
      path: '/secrets/',
      method: 'GET',
      requiresAuth: true,
    },
    getRepositoryVulnerabilities: {
      path: '/vulnerabilities/',
      method: 'GET',
      requiresAuth: true,
    },
    getRepositoryDetails: {
      path: '/repo/',
      method: 'GET',
      requiresAuth: true,
    },
    getRepositorySBOM: {
      path: '/repo/',
      method: 'GET',
      requiresAuth: true,
    },
  },
  group: {
    getGroups: {
      path: '/groups/',
      method: 'GET',
      requiresAuth: true,
    },
    addGroup: {
      path: '/groups/',
      method: 'POST',
      requiresAuth: true,
    },
    getGroupDetails: {
      path: '/groups/',
      method: 'GET',
      requiresAuth: true,
    },
    updateGroup: {
      path: '/groups/',
      method: 'PUT',
      requiresAuth: true,
    },
    deleteGroup: { path: '/groups/', method: 'DELETE', requiresAuth: true },
    getGroupRepositories: {
      path: '/groups/',
      method: 'GET',
      requiresAuth: true,
    },
  },
  secrets: {
    getSecrets: {
      path: '/secrets/unique',
      method: 'POST',
      requiresAuth: true,
    },
    getSecretDetails: {
      path: '/secrets/',
      method: 'GET',
      requiresAuth: true,
    },
    getSecretRepositories: {
      path: '/secrets/:secret_name/repos',
      method: 'GET',
      requiresAuth: true,
    },
  },
  prScans: {
    getPRScans: {
      path: '/pr/scans/',
      method: 'GET',
      requiresAuth: true,
    },
  },
  commitScans: {
    getCommitScans: {
      path: '/live_commits/scan/',
      method: 'GET',
      requiresAuth: true,
    },
    getCommitScanSecrets: {
      path: '/secrets/',
      method: 'GET',
      requiresAuth: true,
    },
  },

  allowList: {
    getAllowList: {
      path: '/whitelist/',
      method: 'GET',
      requiresAuth: true,
    },
    addAllowList: {
      path: '/whitelist/',
      method: 'POST',
      requiresAuth: true,
    },
    updateAllowList: {
      path: '/whitelist/',
      method: 'PUT',
      requiresAuth: true,
    },
  },

  incidents: {
    getIncidents: { path: '/incident/', method: 'POST', requiresAuth: true },
    getOpenIncidents: { path: '/incident/?status=open', method: 'GET', requiresAuth: true },
    getInProgressIncidents: {
      path: '/incident/?page=1&status=in-progress',
      method: 'GET',
      requiresAuth: true,
    },
    getClosedIncidents: {
      path: '/incident/?page=1&status=closed',
      method: 'GET',
      requiresAuth: true,
    },
    updateIncidentStatus: { path: '/incident/', method: 'PATCH', requiresAuth: true },
    getIncidentDetails: {
      path: '/incident/',
      method: 'GET',
      requiresAuth: true,
    },
    updateIncidentSeverity: {
      path: '/incident/',
      method: 'PATCH',
      requiresAuth: true,
    },
    getActivity: {
      path: '/incident/',
      method: 'GET',
      requiresAuth: true,
    },
    getComments: {
      path: '/incident/',
      method: 'GET',
      requiresAuth: true,
    },
    addComment: {
      path: '/incident/comments',
      method: 'POST',
      requiresAuth: true,
    },
    bulkUpdateStatus: {
      path: '/incident/bulk-update/by-ids',
      method: 'PATCH',
      requiresAuth: true,
    },
    getStats: {
      path: '/incident/severity-count',
      method: 'GET',
      requiresAuth: true,
    },
  },

  vulnerabilities: {
    getVulnerabilities: {
      path: '/vulnerabilities/',
      method: 'GET',
      requiresAuth: true,
    },
    getVulnerabilityDetails: {
      path: '/vulnerabilities/',
      method: 'GET',
      requiresAuth: true,
    },
    getUniqueVulnerabilities: {
      path: '/vulnerabilities/unique',
      method: 'POST',
      requiresAuth: true,
    },
    getVulnerabilityRepositories: {
      path: '/vulnerabilities/:vulnerability_id/repos',
      method: 'GET',
      requiresAuth: true,
    },
  },

  vm: {
    getAssets: {
      path: '/v2/assets/assets/search',
      method: 'POST',
      requiresAuth: true,
    },
    getAssetsFiltersValues: {
      path: '/v2/assets/assets/filters/:filter_key/values',
      method: 'GET',
      requiresAuth: true,
    },
  },

  // Settings

  vcs: {
    getVcs: {
      path: '/vc/',
      method: 'GET',
      requiresAuth: true,
    },
    addVcs: {
      path: '/vc/',
      method: 'POST',
      requiresAuth: true,
    },
    deleteVcs: {
      path: '/vc/',
      method: 'DELETE',
      requiresAuth: true,
    },
    updateVcs: {
      path: '/vc/',
      method: 'PUT',
      requiresAuth: true,
    },
    getWebhookConfig: {
      path: '/webhook_config/',
      method: 'GET',
      requiresAuth: true,
    },
    createWebhook: {
      path: '/webhook_config/',
      method: 'POST',
      requiresAuth: true,
    },
    updateWebhook: {
      path: '/webhook_config/',
      method: 'PUT',
      requiresAuth: true,
    },
  },

  sources: {
    addCloudSources: {
      path: '/v2/assets/sources',
      method: 'POST',
      requiresAuth: true,
    },
    getSources: {
      path: '/v2/assets/sources/get-list',
      method: 'POST',
      requiresAuth: true,
    },
    editCloudSources: {
      path: '/v2/assets/sources',
      method: 'PUT',
      requiresAuth: true,
    },
    deleteCloudSources: {
      path: '/v2/assets/sources',
      method: 'DELETE',
      requiresAuth: true,
    },
    getCloudProviders: {
      path: '/v2/assets/sources/clouds',
      method: 'GET',
      requiresAuth: true,
    },
  },

  integrations: {
    getSlackConfig: {
      path: '/slackIntegration/',
      method: 'GET',
      requiresAuth: true,
    },
    updateSlackConfig: {
      path: '/slackIntegration/',
      method: 'PUT',
      requiresAuth: true,
    },
    addSlackConfig: {
      path: '/slackIntegration/',
      method: 'POST',
      requiresAuth: true,
    },
    getJiraConfig: {
      path: '/jira-alert/',
      method: 'GET',
      requiresAuth: true,
    },

    updateJiraConfig: {
      path: '/jira-alert/',
      method: 'PUT',
      requiresAuth: true,
    },
    addJiraConfig: {
      path: '/jira-alert/',
      method: 'POST',
      requiresAuth: true,
    },
  },

  sso: {
    getConfigs: {
      path: '/v2/user-auth/sso/config',
      method: 'GET',
      requiresAuth: true,
    },
    createConfig: {
      path: '/v2/user-auth/sso/config',
      method: 'POST',
      requiresAuth: true,
    },
    updateConfig: {
      path: '/v2/user-auth/sso/config',
      method: 'POST',
      requiresAuth: true,
    },
    deleteConfig: {
      path: '/v2/user-auth/sso/config',
      method: 'DELETE',
      requiresAuth: true,
    },
    getSSOProviders: {
      path: '/v2/user-auth/sso/config/',
      method: 'GET',
      requiresAuth: false,
    },
    initiateSSO: {
      path: '/v2/user-auth/sso/',
      method: 'GET',
      requiresAuth: false,
    },
    exchangeSSO: {
      path: '/v2/user-auth/sso/callback',
      method: 'GET',
      requiresAuth: false,
    },
  },

  users: {
    getUsers: {
      path: '/users/',
      method: 'GET',
      requiresAuth: true,
    },
    createUser: {
      path: '/users/',
      method: 'POST',
      requiresAuth: true,
    },
    deleteUser: {
      path: '/users/',
      method: 'DELETE',
      requiresAuth: true,
    },
    updateUser: {
      path: '/users/',
      method: 'PUT',
      requiresAuth: true,
    },
    getUserDetail: {
      path: '/users/',
      method: 'GET',
      requiresAuth: true,
    },
  },
};

// Type for API Error
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Helper function to get full URL for an endpoint
export const getEndpointUrl = (endpointPath: string, params?: Record<string, string>): string => {
  let url = `${getCurrentBaseUrl()}${endpointPath}`;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }

  return url;
};

// Create endpoint URL with type safety
export const createEndpointUrl = (
  endpoint: EndpointConfig,
  params?: Record<string, string>
): string => {
  return getEndpointUrl(endpoint.path, params);
};

// Debug function to check current configuration
export const debugApiConfig = () => {
  console.log('Current Environment:', getCurrentEnvironment());
  console.log('Current Base URL:', getCurrentBaseUrl());
};
