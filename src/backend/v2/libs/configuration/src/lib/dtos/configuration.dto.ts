import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateConfigurationDto {
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsObject()
  config!: Record<string, any>;
}

export class UpdateConfigurationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
