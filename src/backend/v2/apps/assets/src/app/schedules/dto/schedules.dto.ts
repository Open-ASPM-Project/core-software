import { Asset, Source } from '@firewall-backend/entities';
import {
  ScanTriggerType,
  ScheduleType,
  VulnerabilityProfiles,
} from '@firewall-backend/enums';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  name: string;

  @IsBoolean()
  active: boolean;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsInt()
  @Min(1)
  interval: number;

  @IsOptional()
  @IsArray()
  @IsEnum(VulnerabilityProfiles, { each: true })
  vulnerabilityProfiles?: VulnerabilityProfiles[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assetIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sourceIds?: string[];
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(VulnerabilityProfiles, { each: true })
  vulnerabilityProfiles?: VulnerabilityProfiles[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assetIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  sourceIds?: string[];
}

export class ScheduleIdParamsDto {
  @IsUUID()
  schedule_id: string;
}

export class CreateScheduleRunDto {
  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsOptional()
  @IsArray()
  @IsEnum(VulnerabilityProfiles, { each: true })
  vulnerabilityProfiles?: VulnerabilityProfiles[];

  @IsOptional()
  @IsArray()
  assets?: Asset[];

  @IsOptional()
  @IsArray()
  sources?: Source[];

  @IsOptional()
  @IsInt()
  scheduleId?: number;

  @IsOptional()
  @IsEnum(ScanTriggerType)
  triggerType?: ScanTriggerType;

  @IsOptional()
  @IsInt()
  currentUserId?: number;

  @IsOptional()
  @IsInt()
  assetScanId?: number;

  @IsOptional()
  @IsInt()
  sourceId?: number;
}
