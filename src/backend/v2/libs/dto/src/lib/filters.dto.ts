import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationRequestDto } from './pagination.dto';
import { IsPrimitive } from '@firewall-backend/decorators';

export class FilterSearchQueryDto extends PaginationRequestDto {
  @IsString()
  @IsOptional()
  search?: string;
}

export class FilterKeyValue {
  @IsString()
  filter_key!: string;

  @IsPrimitive()
  value!: string;
}

export class ApplyFiltersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterKeyValue)
  filters!: FilterKeyValue[];
}

export class FilterKeyParamsDto {
  @IsString()
  filter_key!: string;
}
