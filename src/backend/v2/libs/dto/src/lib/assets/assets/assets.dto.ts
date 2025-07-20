import { AssetType } from '@firewall-backend/enums';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIP,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { CreateServiceDto } from './service-assets.dto';

export class CreateDomainDto {
  @IsUrl()
  url!: string;
}

export class CreateSubdomainDto {
  @IsUrl()
  url!: string;
}

export class CreateIpDto {
  @IsIP()
  ip!: string;
}

class WebappScreenshotDto {
  @IsString()
  metadata!: string;

  @IsString()
  image!: string;
}

export class CreateWebappDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  screenshots?: WebappScreenshotDto[];
}

export class CreateWebappApiDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  curlRequest?: string;

  @IsOptional()
  @IsString()
  curlResponse?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class CreateAssetDto {
  @IsEnum(AssetType)
  type!: AssetType;

  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsObject()
  @IsOptional()
  domain?: CreateDomainDto;

  @IsObject()
  @IsOptional()
  subdomain?: CreateSubdomainDto;

  @IsObject()
  @IsOptional()
  ip?: CreateIpDto;

  @IsObject()
  @IsOptional()
  webapp?: CreateWebappDto;

  @IsObject()
  @IsOptional()
  webappApi?: CreateWebappApiDto;

  @IsOptional()
  @IsObject()
  service?: CreateServiceDto;
}

export class UpdateAssetDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsOptional()
  @IsString()
  name?: string;
}

export class AssetIdParamsDto {
  @IsUUID()
  asset_id!: string;
}

export class AssetIdsParamsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  assetIds!: string[];
}

export class AssetTypeQueryDto {
  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;
}
