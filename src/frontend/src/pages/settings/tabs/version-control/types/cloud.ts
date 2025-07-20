export type CloudType =
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'do'
  | 'scw'
  | 'arvancloud'
  | 'cloudflare'
  | 'heroku'
  | 'fastly'
  | 'linode'
  | 'namecheap'
  | 'alibaba'
  | 'terraform'
  | 'consul'
  | 'nomad'
  | 'hetzner'
  | 'kubernetes'
  | 'dnssimple';

export interface CloudConfig {
  id: number;
  uuid: string;
  sourceType: string;
  name: string;
  cloudType: CloudType;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  addedByUid: number;
  updatedByUid: number;
}

export interface CloudProviderConfig {
  label: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  description: string;
  logoPlaceholder: string;
}
