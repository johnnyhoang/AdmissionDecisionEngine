import { IsNumber, IsOptional, IsString, IsArray, Min, Max } from 'class-validator';

export class GetRecommendationDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  math: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  literature: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  english: number;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsNumber()
  @IsOptional()
  bonus?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredDistricts?: string[];

  @IsString()
  @IsOptional()
  targetNV?: string; // NV1, NV2, NV3
}

export class GetComboRecommendationDto {
  @IsNumber()
  minMath: number;
  @IsNumber()
  maxMath: number;

  @IsNumber()
  minLiterature: number;
  @IsNumber()
  maxLiterature: number;

  @IsNumber()
  minEnglish: number;
  @IsNumber()
  maxEnglish: number;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsNumber()
  @IsOptional()
  bonus?: number;

  @IsNumber()
  @IsOptional()
  userLat?: number;

  @IsNumber()
  @IsOptional()
  userLon?: number;

  @IsString()
  @IsOptional()
  dreamSchoolCode?: string;

  @IsNumber()
  @IsOptional()
  maxCommuteDistance?: number;
}
