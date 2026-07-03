import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { Program } from '../database/entities/program.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { University } from '../database/entities/university.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program, AdmissionRule, University]),
    RuleEngineModule
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
