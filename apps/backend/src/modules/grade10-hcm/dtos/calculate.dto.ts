import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CalculateScoreDto {
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
}
