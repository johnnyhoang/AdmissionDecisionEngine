import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  activities?: string;

  @IsString()
  @IsOptional()
  regulations?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  longitude?: number;
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

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  activities?: string;

  @IsString()
  @IsOptional()
  regulations?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  @IsOptional()
  cutoffs?: any[];

  @IsOptional()
  quotas?: any[];
}
