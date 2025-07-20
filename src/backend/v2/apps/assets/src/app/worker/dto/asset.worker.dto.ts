import { AssetSubType } from '@firewall-backend/enums';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class GetWebServersDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ports: number[];
}

export class GetSteampipeAssetsQueryDto {
  @IsUUID()
  source_id: string;

  @IsOptional()
  @IsEnum(AssetSubType)
  sub_type?: AssetSubType;
}
