import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAssetGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsUUID('all', { each: true })
  assetIds: string[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class GroupIdParamsDto {
  @IsUUID()
  group_id: string;
}

export class AssetIdsDto {
  @IsUUID('all', { each: true })
  assetIds: string[];
}
