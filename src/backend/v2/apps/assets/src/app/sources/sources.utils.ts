import { Injectable, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import axios from 'axios';
import * as AWS from 'aws-sdk';
import { GoogleAuth } from 'google-auth-library';
import { CloudType } from '@firewall-backend/enums';
import { CreateCloudDto } from './dto/sources.dto';

@Injectable()
export class SourcesUtils {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Validate AWS credentials
   */
  private async validateAwsCredentials(
    accessKey: string,
    secretKey: string
  ): Promise<boolean> {
    try {
      const sts = new AWS.STS({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      });
      await sts.getCallerIdentity().promise();
      return true;
    } catch (error) {
      this.logger.error({ error }, 'AWS credential validation failed');
      return false;
    }
  }

  /**
   * Validate Azure credentials
   */
  private async validateAzureCredentials(
    clientId: string,
    clientSecret: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'https://management.azure.com/.default',
        })
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error({ error }, 'Azure credential validation failed');
      return false;
    }
  }

  /**
   * Validate GCP credentials
   */
  private async validateGcpCredentials(
    serviceAccountKey: string
  ): Promise<boolean> {
    try {
      const auth = new GoogleAuth({
        credentials: JSON.parse(serviceAccountKey),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      await auth.getClient();
      return true;
    } catch (error) {
      this.logger.error({ error }, 'GCP credential validation failed');
      return false;
    }
  }

  /**
   * Validate credentials for any cloud type
   */
  async validateCloudCredentials(cloud: CreateCloudDto): Promise<void> {
    if (!cloud) {
      throw new BadRequestException('Cloud configuration is required');
    }

    switch (cloud.cloudType) {
      case CloudType.AWS: {
        if (!cloud.aws?.awsAccessKey || !cloud.aws?.awsSecretKey) {
          throw new BadRequestException('AWS credentials are missing');
        }
        const awsIsValid = await this.validateAwsCredentials(
          cloud.aws.awsAccessKey,
          cloud.aws.awsSecretKey
        );
        if (!awsIsValid) {
          throw new BadRequestException('Invalid AWS credentials');
        }
        break;
      }
      case CloudType.AZURE: {
        if (
          !cloud.azure?.clientId ||
          !cloud.azure?.clientSecret ||
          !cloud.azure?.tenantId
        ) {
          throw new BadRequestException('Azure credentials are missing');
        }
        const azureIsValid = await this.validateAzureCredentials(
          cloud.azure.clientId,
          cloud.azure.clientSecret,
          cloud.azure.tenantId
        );
        if (!azureIsValid) {
          throw new BadRequestException('Invalid Azure credentials');
        }
        break;
      }
      case CloudType.GCP: {
        if (!cloud.gcp?.gcpServiceAccountKey) {
          throw new BadRequestException('GCP credentials are missing');
        }
        const gcpIsValid = await this.validateGcpCredentials(
          cloud.gcp.gcpServiceAccountKey
        );
        if (!gcpIsValid) {
          throw new BadRequestException('Invalid GCP credentials');
        }
        break;
      }
      default:
        if (!Object.values(CloudType).includes(cloud.cloudType)) {
          throw new BadRequestException('Unsupported cloud type');
        }
    }
  }
}
