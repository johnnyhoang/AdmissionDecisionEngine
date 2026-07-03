import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { DataImport } from '../database/entities/data-import.entity';

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
      DataImport,
    ]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
