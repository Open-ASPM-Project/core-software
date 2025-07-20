import {
  AwsServiceAssetType,
  AssetSubType,
  AssetType,
} from '@firewall-backend/enums';
import { UserResponse } from '../../user-auth/user/user.types';

export interface AssetResponse {
  uuid: string;
  active: boolean;
  type: AssetType;
  subType?: AssetSubType;
  name?: string;
  url?: string;
  ipAddress?: string;
  ipType?: string;
  port?: number;
  vulnerabilityCount: number | null;
  curlRequest?: string;
  curlResponse?: string;
  metadata?: string;
  assetScreenshots?: AssetScreenshotResponse[];
  domainAsset?: AssetResponse;
  subdomainAsset?: AssetResponse;
  ipAsset?: AssetResponse;
  webappAsset?: AssetResponse;
  awsService?: AwsServiceAssetResponse;
  createdAt: Date;
  updatedAt: Date;
  addedBy: UserResponse | null;
  updatedBy: UserResponse | null;
}

export interface AssetScreenshotResponse {
  uuid: string;
  metadata: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AwsServiceAssetResponse {
  type: AwsServiceAssetType;
  metadata: string;
  ec2PublicDnsName?: string;
  ec2PublicIpAddress?: string;
  ec2SecurityGroups?: AwsServiceAssetResponse[];
  ec2Webapps?: AssetResponse[];
  securityGroupId?: string;
  securityGroupName?: string;
  sgFromPorts?: number[];
  loadBalancerDnsName?: string;
  route53RecordName?: string;
  s3BucketUrl?: string;
  apiGatewayUrl?: string;
  rdsEndpointAddress?: string;
  rdsEndpointPort?: number;
  domainAsset?: AssetResponse;
  subdomainAsset?: AssetResponse;
  ipAsset?: AssetResponse;
  webappAsset?: AssetResponse;
}
