import { CloudType, SourceType } from '@firewall-backend/enums';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  CreateAlibabaCloudDto,
  CreateArvanCloudDto,
  CreateAWSCloudDto,
  CreateAzureCloudDto,
  CreateCloudflareCloudDto,
  CreateConsulCloudDto,
  CreateDigitalOceanCloudDto,
  CreateDNSSimpleCloudDto,
  CreateFastlyCloudDto,
  CreateGCPCloudDto,
  CreateHerokuCloudDto,
  CreateHetznerCloudDto,
  CreateKubernetesCloudDto,
  CreateLinodeCloudDto,
  CreateNamecheapCloudDto,
  CreateNomadCloudDto,
  CreateScalewayCloudDto,
  CreateTerraformCloudDto,
} from './clouds.dto';

export class CreateCloudDto {
  @IsEnum(CloudType)
  cloudType: CloudType;

  @IsObject()
  @IsOptional()
  aws?: CreateAWSCloudDto;

  @IsObject()
  @IsOptional()
  gcp?: CreateGCPCloudDto;

  @IsObject()
  @IsOptional()
  azure?: CreateAzureCloudDto;

  @IsObject()
  @IsOptional()
  do?: CreateDigitalOceanCloudDto;

  @IsObject()
  @IsOptional()
  scw?: CreateScalewayCloudDto;

  @IsObject()
  @IsOptional()
  arvancloud?: CreateArvanCloudDto;

  @IsObject()
  @IsOptional()
  cloudflare?: CreateCloudflareCloudDto;

  @IsObject()
  @IsOptional()
  heroku?: CreateHerokuCloudDto;

  @IsObject()
  @IsOptional()
  fastly?: CreateFastlyCloudDto;

  @IsObject()
  @IsOptional()
  linode?: CreateLinodeCloudDto;

  @IsObject()
  @IsOptional()
  namecheap?: CreateNamecheapCloudDto;

  @IsObject()
  @IsOptional()
  alibaba?: CreateAlibabaCloudDto;

  @IsObject()
  @IsOptional()
  terraform?: CreateTerraformCloudDto;

  @IsObject()
  @IsOptional()
  consul?: CreateConsulCloudDto;

  @IsObject()
  @IsOptional()
  nomad?: CreateNomadCloudDto;

  @IsObject()
  @IsOptional()
  hetzner?: CreateHetznerCloudDto;

  @IsObject()
  @IsOptional()
  kubernetes?: CreateKubernetesCloudDto;

  @IsObject()
  @IsOptional()
  dnssimple?: CreateDNSSimpleCloudDto;
}

export type CreateSourceTypeDto = CreateCloudDto;

export class CreateSourceDto {
  @IsEnum(SourceType)
  type: SourceType;

  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @IsObject()
  @IsOptional()
  cloud?: CreateCloudDto;
}

export class SourceIdParamsDto {
  @IsUUID()
  source_id: string;
}
