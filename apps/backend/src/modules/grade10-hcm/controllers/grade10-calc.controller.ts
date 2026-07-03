import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Grade10CalcService } from '../services/grade10-calc.service';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';

@ApiTags('grade10-hcm-calculator')
@Controller('api/v1/grade10-hcm')
export class Grade10CalcController {
  constructor(private readonly calcService: Grade10CalcService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate final admission score from subject values' })
  async calculate(@Body() dto: CalculateScoreDto) {
    const finalScore = this.calcService.calculateScore(dto);
    return { finalScore };
  }

  @Post('recommendation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get smart school recommendations with estimated pass probability' })
  async getRecommendations(@Body() dto: GetRecommendationDto) {
    return this.calcService.getRecommendations(dto);
  }
}
