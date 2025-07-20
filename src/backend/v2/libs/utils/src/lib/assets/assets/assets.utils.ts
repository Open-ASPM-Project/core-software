import { Asset } from '@firewall-backend/entities';
import { AssetType, AwsServiceAssetType } from '@firewall-backend/enums';
import {
  AssetResponse,
  AssetScreenshotResponse,
  AwsServiceAssetResponse,
} from '@firewall-backend/types';
import { isIP } from 'net';
import { mapUserResponse } from '../../user-auth/user/user.utils';
import { CreateAssetDto } from '@firewall-backend/dto';
import { getHostname, getDomain, getSubdomain } from 'tldts';

/**
 * Build an asset DTO based on discovered cloud asset properties
 */
export function buildAssetDto(
  asset: string,
  sourceId?: string
): CreateAssetDto {
  const assetType = determineAssetType(asset);

  const assetDto: CreateAssetDto = {
    active: true,
    type: assetType,
    sourceId,
  };

  if (assetType === AssetType.IP) {
    assetDto.ip = {
      ip: asset,
    };
  }

  if (assetType === AssetType.DOMAIN) {
    assetDto.domain = {
      url: asset,
    };
  }

  if (assetType === AssetType.SUBDOMAIN) {
    assetDto.subdomain = {
      url: asset,
    };
  }

  if (assetType === AssetType.WEBAPP) {
    assetDto.webapp = {
      url: asset,
    };
  }

  return assetDto;
}

/**
 * Determine the appropriate asset type based on cloud resource properties
 */
export function determineAssetType(asset: string): AssetType {
  try {
    // Check if the asset has a port specification (with or without a path)
    if (/:(\d+)(\/.*)?$/.test(asset)) {
      return AssetType.WEBAPP;
    }

    const hostname = getHostname(asset);
    if (hostname && isIP(hostname)) {
      return AssetType.IP;
    }

    const subdomain = getSubdomain(asset);
    if (subdomain && subdomain != 'www') {
      return AssetType.SUBDOMAIN;
    }

    const domain = getDomain(asset);
    if (domain) {
      return AssetType.DOMAIN;
    }

    return AssetType.UNKNOWN;
  } catch {
    // Return UNKNOWN if an error occurs during asset type determination
    return AssetType.UNKNOWN;
  }
}

export function mapAssetResponse(asset?: Asset): AssetResponse | undefined {
  if (!asset) {
    return;
  }

  const assetType = asset.type;

  const common = {
    uuid: asset.uuid,
    active: asset.active,
    type: asset.type,
    name: asset.name,
    vulnerabilityCount: asset.vulnerabilities?.length ?? null,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    addedBy: mapUserResponse(asset.addedBy),
    updatedBy: mapUserResponse(asset.updatedBy),
  };

  let response: AssetResponse;
  switch (assetType) {
    case AssetType.DOMAIN: {
      response = {
        ...common,
        url: asset.url,
      };
      break;
    }
    case AssetType.SUBDOMAIN: {
      response = {
        ...common,
        url: asset.url,
        domainAsset: mapAssetResponse(asset.domainAsset),
      };
      break;
    }
    case AssetType.IP: {
      response = {
        ...common,
        ipAddress: asset.ipAddress,
        ipType: asset.ipType,
      };
      break;
    }
    case AssetType.WEBAPP: {
      const assetScreenshots: AssetScreenshotResponse[] = [];
      if (asset?.assetScreenshots?.length) {
        for (const screenshot of asset.assetScreenshots) {
          assetScreenshots.push({
            uuid: screenshot.uuid,
            createdAt: screenshot.createdAt,
            updatedAt: screenshot.updatedAt,
            metadata: JSON.stringify(screenshot.metadata),
            image: screenshot.image.toString('base64'), // Convert image to base64
          });
        }
      }
      response = {
        ...common,
        url: asset.url,
        port: asset.port,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
        ipAsset: mapAssetResponse(asset.ipAsset),
        assetScreenshots,
      };
      break;
    }
    case AssetType.WEBAPP_API: {
      response = {
        ...common,
        url: asset.url,
        curlRequest: asset.curlRequest,
        curlResponse: asset.curlResponse,
        metadata: asset.metadata,
        webappAsset: mapAssetResponse(asset.webappAsset),
      };
      break;
    }
    case AssetType.SERVICE: {
      response = {
        ...common,
        subType: asset.subType,
        awsService: mapAwsServiceAssetResponse(asset),
      };
      break;
    }
    default: {
      response = common;
      break;
    }
  }

  return response;
}

export function mapAwsServiceAssetResponse(
  asset?: Asset
): AwsServiceAssetResponse | undefined {
  if (!asset) {
    return;
  }

  const common = {
    type: asset.type as unknown as AwsServiceAssetType,
    metadata: asset?.metadata ?? '',
  };

  let response: AwsServiceAssetResponse;
  switch (asset.subType as unknown as AwsServiceAssetType) {
    case AwsServiceAssetType.AWS_EC2_INSTANCE: {
      response = {
        ...common,
        ec2PublicDnsName: asset.url,
        ec2PublicIpAddress: asset.ipAddress,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
        ipAsset: mapAssetResponse(asset.ipAsset),
        ec2SecurityGroups: asset.ec2SecurityGroups
          ?.map((ec2Sg) => mapAwsServiceAssetResponse(ec2Sg))
          .filter((sg) => sg !== undefined),
        ec2Webapps: asset.ec2Webapps
          ?.map((ec2Webapp) => mapAssetResponse(ec2Webapp))
          .filter((webapp) => webapp !== undefined),
      };
      break;
    }
    case AwsServiceAssetType.AWS_VPC_SECURITY_GROUP: {
      return {
        ...common,
        securityGroupId: asset.securityGroupId,
        securityGroupName: asset.securityGroupName,
        sgFromPorts: JSON.parse(asset.sgFromPorts ?? '[]'),
      };
    }
    case AwsServiceAssetType.AWS_EC2_APPLICATION_LOAD_BALANCER:
    case AwsServiceAssetType.AWS_EC2_CLASSIC_LOAD_BALANCER:
    case AwsServiceAssetType.AWS_EC2_GATEWAY_LOAD_BALANCER: {
      response = {
        ...common,
        loadBalancerDnsName: asset.url,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
      };
      break;
    }
    case AwsServiceAssetType.AWS_RDS_DB_INSTANCE: {
      response = {
        ...common,
        rdsEndpointAddress: asset.url,
        rdsEndpointPort: asset.port,
        webappAsset: mapAssetResponse(asset.webappAsset),
      };
      break;
    }
    case AwsServiceAssetType.AWS_ROUTE53_RECORD: {
      response = {
        ...common,
        route53RecordName: asset.url,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
      };
      break;
    }
    case AwsServiceAssetType.AWS_S3_BUCKET: {
      response = {
        ...common,
        s3BucketUrl: asset.url,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
      };
      break;
    }
    case AwsServiceAssetType.AWS_API_GATEWAY_REST_API:
    case AwsServiceAssetType.AWS_API_GATEWAY_STAGE: {
      response = {
        ...common,
        apiGatewayUrl: asset.url,
        domainAsset: mapAssetResponse(asset.domainAsset),
        subdomainAsset: mapAssetResponse(asset.subdomainAsset),
      };
      break;
    }
    default:
      response = common;
      break;
  }

  return response;
}
