import {
  AssetType,
  ScanTriggerType,
  SourceType,
  VulnerabilityProfiles,
} from '@firewall-backend/enums';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  DEFAULT_CONFIG_UUID,
  DEFAULT_DAST_CONFIG_UUID,
  DEFAULT_TECH_CONFIG_UUID,
} from '@firewall-backend/constants';

export class AssetEventData {
  @IsInt()
  assetId!: number;

  @IsString()
  assetName!: string;

  @IsEnum(AssetType)
  assetType!: AssetType;

  @IsEnum(ScanTriggerType)
  scanType!: ScanTriggerType;

  @IsOptional()
  @IsInt()
  scanCreatedBy?: number;

  @IsOptional()
  @IsInt()
  scheduleRunId?: number;

  @IsOptional()
  @IsEnum(VulnerabilityProfiles, { each: true })
  profiles?: VulnerabilityProfiles[];

  @IsOptional()
  @IsUUID()
  configurationId?: string = DEFAULT_CONFIG_UUID;

  @IsOptional()
  @IsUUID()
  dastConfigurationId?: string = DEFAULT_DAST_CONFIG_UUID;

  @IsOptional()
  @IsUUID()
  techConfigurationId?: string = DEFAULT_TECH_CONFIG_UUID;
}

export class WebappAssetEventData {
  @IsInt()
  webappId!: number;

  @IsEnum(ScanTriggerType)
  scanType!: ScanTriggerType;

  @IsOptional()
  @IsInt()
  sourceId?: number;

  @IsOptional()
  @IsInt()
  scanCreatedBy?: number;

  @IsOptional()
  @IsInt()
  scheduleRunId?: number;

  @IsOptional()
  @IsInt()
  assetScanId?: number;
}

export class SourceEventData {
  @IsInt()
  sourceId!: number;

  @IsString()
  sourceName!: string;

  @IsEnum(SourceType)
  sourceType!: SourceType;

  @IsEnum(ScanTriggerType)
  scanType!: ScanTriggerType;

  @IsOptional()
  @IsInt()
  scanCreatedBy?: number;

  @IsOptional()
  @IsInt()
  scheduleRunId?: number;

  @IsOptional()
  @IsInt()
  assetScanId?: number;
}
