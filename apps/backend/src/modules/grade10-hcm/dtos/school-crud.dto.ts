import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsString()
  @IsOptional()
  schoolType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSchoolDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mapUrl?: string;

  @IsString()
  @IsOptional()
  schoolType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
