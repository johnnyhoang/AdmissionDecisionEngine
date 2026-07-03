import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UniversityService } from './university.service';
import { UniversityController } from './university.controller';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      University,
      Campus,
      Major,
      Program,
      AdmissionMethod,
      AdmissionRule,
      AdmissionScore,
    ]),
  ],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService, TypeOrmModule],
})
export class UniversityModule {}
