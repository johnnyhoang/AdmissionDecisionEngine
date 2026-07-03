import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { University } from '../database/entities/university.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { Grade10School } from '../grade10-hcm/entities/school.entity';
import { Grade10District } from '../grade10-hcm/entities/district.entity';
import { Grade10Cutoff } from '../grade10-hcm/entities/cutoff.entity';
import { Grade10Quota } from '../grade10-hcm/entities/quota.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      University,
      Major,
      Program,
      AdmissionMethod,
      AdmissionRule,
      AdmissionScore,
      Grade10School,
      Grade10District,
      Grade10Cutoff,
      Grade10Quota,
    ]),
  ],

  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
