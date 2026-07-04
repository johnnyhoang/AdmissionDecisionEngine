import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade10School } from './entities/school.entity';
import { Grade10District } from './entities/district.entity';
import { Grade10Quota } from './entities/quota.entity';
import { Grade10Cutoff } from './entities/cutoff.entity';
import { Grade10History } from './entities/history.entity';
import { Grade10ImportLog } from './entities/import-log.entity';
import { Grade10ActivityLog } from './entities/activity-log.entity';

import { Grade10SchoolService } from './services/grade10-school.service';
import { Grade10CalcService } from './services/grade10-calc.service';
import { Grade10ImportService } from './services/grade10-import.service';

import { Grade10SchoolController } from './controllers/grade10-school.controller';
import { Grade10CalcController } from './controllers/grade10-calc.controller';
import { Grade10AdminController } from './controllers/grade10-admin.controller';
import { Grade10ActivityLogController } from './controllers/grade10-activity-log.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade10School,
      Grade10District,
      Grade10Quota,
      Grade10Cutoff,
      Grade10History,
      Grade10ImportLog,
      Grade10ActivityLog,
    ]),
  ],
  controllers: [
    Grade10SchoolController,
    Grade10CalcController,
    Grade10AdminController,
    Grade10ActivityLogController,
  ],
  providers: [Grade10SchoolService, Grade10CalcService, Grade10ImportService],
  exports: [
    Grade10SchoolService,
    Grade10CalcService,
    Grade10ImportService,
    TypeOrmModule,
  ],
})
export class Grade10HcmModule {}
