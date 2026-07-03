import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Grade10CalcService } from '../services/grade10-calc.service';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';

@ApiTags('grade10-hcm-calculator')
@Controller('api/v1/grade10-hcm')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Grade10CalcController {
  constructor(private readonly calcService: Grade10CalcService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate final admission score from subject values',
  })
  @RequirePermission('GRADE10', 'view_recommendation', 'view')
  async calculate(@Body() dto: CalculateScoreDto) {
    const finalScore = this.calcService.calculateScore(dto);
    return { finalScore };
  }

  @Post('recommendation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get smart school recommendations with estimated pass probability',
  })
  @RequirePermission('GRADE10', 'view_recommendation', 'view')
  async getRecommendations(@Body() dto: GetRecommendationDto) {
    return this.calcService.getRecommendations(dto);
  }
}
