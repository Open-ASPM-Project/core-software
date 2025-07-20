import { AssetSubType } from '@firewall-backend/enums';
import {
  IsEnum,
  IsIP,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateAwsEc2InstanceDto {
  @IsUrl()
  publicDnsName!: string;

  @IsIP()
  publicIpAddress!: string;

  @IsUUID(undefined, { each: true })
  securityGroups!: string[];
}

export class CreateAwsVpcSecurityGroupDto {
  @IsString()
  groupId!: string;

  @IsString()
  groupName!: string;

  @IsPositive({ each: true })
  fromPorts!: number[];
}

export class CreateAwsEc2LoadBalancerDto {
  @IsUrl()
  dnsName!: string;
}

export class CreateAwsRdsDbInstanceDto {
  @IsUrl()
  endpointAddress!: string;

  @IsPositive()
  endpointPort!: number;
}

export class CreateAwsRoute53RecordDto {
  @IsString()
  name!: string;
}

export class CreateAwsS3BucketDto {
  @IsString()
  name!: string;
}

export class CreateAwsApiGatewayDto {
  @IsUrl()
  apiGatewayUrl!: string;
}

export class CreateServiceDto {
  @IsEnum(AssetSubType)
  subType!: AssetSubType;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsObject()
  awsEc2Instance?: CreateAwsEc2InstanceDto;

  @IsOptional()
  @IsObject()
  awsVpcSecurityGroup?: CreateAwsVpcSecurityGroupDto;

  @IsOptional()
  @IsObject()
  awsEc2ApplicationLoadBalancer?: CreateAwsEc2LoadBalancerDto;

  @IsOptional()
  @IsObject()
  awsEc2ClassicLoadBalancer?: CreateAwsEc2LoadBalancerDto;

  @IsOptional()
  @IsObject()
  awsEc2GatewayLoadBalancer?: CreateAwsEc2LoadBalancerDto;

  @IsOptional()
  @IsObject()
  awsRdsDbInstance?: CreateAwsRdsDbInstanceDto;

  @IsOptional()
  @IsObject()
  awsRoute53Record?: CreateAwsRoute53RecordDto;

  @IsOptional()
  @IsObject()
  awsS3Bucket?: CreateAwsS3BucketDto;

  @IsOptional()
  @IsObject()
  awsApiGatewayRestApi?: CreateAwsApiGatewayDto;

  @IsOptional()
  @IsObject()
  awsApiGatewayStage?: CreateAwsApiGatewayDto;
}
