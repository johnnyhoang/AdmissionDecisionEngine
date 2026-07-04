import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RuleEngineModule } from './modules/rule-engine/rule-engine.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { UniversityModule } from './modules/university/university.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { ImportModule } from './modules/import/import.module';
import { Grade10HcmModule } from './modules/grade10-hcm/grade10-hcm.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/database/entities/user.entity';
import { UserPermission } from './modules/database/entities/user-permission.entity';
import { AdmissionMethod } from './modules/database/entities/admission-method.entity';
import { AdmissionRule } from './modules/database/entities/admission-rule.entity';
import { AdmissionScore } from './modules/database/entities/admission-score.entity';
import { Campus } from './modules/database/entities/campus.entity';
import { CandidateProfile } from './modules/database/entities/candidate-profile.entity';
import { DataImport } from './modules/database/entities/data-import.entity';
import { EvaluationHistory } from './modules/database/entities/evaluation-history.entity';
import { Major } from './modules/database/entities/major.entity';
import { Program } from './modules/database/entities/program.entity';
import { SubjectCombination } from './modules/database/entities/subject-combination.entity';
import { University } from './modules/database/entities/university.entity';

import { Grade10School } from './modules/grade10-hcm/entities/school.entity';
import { Grade10District } from './modules/grade10-hcm/entities/district.entity';
import { Grade10Quota } from './modules/grade10-hcm/entities/quota.entity';
import { Grade10Cutoff } from './modules/grade10-hcm/entities/cutoff.entity';
import { Grade10History } from './modules/grade10-hcm/entities/history.entity';
import { Grade10ImportLog } from './modules/grade10-hcm/entities/import-log.entity';
import { Grade10ActivityLog } from './modules/grade10-hcm/entities/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: url || undefined,
          host: url
            ? undefined
            : config.get<string>(
                'DB_HOST',
                'aws-1-ap-southeast-1.pooler.supabase.com',
              ),
          port: url ? undefined : config.get<number>('DB_PORT', 5432),
          username: url
            ? undefined
            : config.get<string>(
                'DB_USERNAME',
                'postgres.czngbleeeiljsrpbaksg',
              ),
          password: url ? undefined : config.get<string>('DB_PASSWORD', ''),
          database: url
            ? undefined
            : config.get<string>('DB_DATABASE', 'postgres'),
          entities: [
            User,
            UserPermission,
            AdmissionMethod,
            AdmissionRule,
            AdmissionScore,
            Campus,
            CandidateProfile,
            DataImport,
            EvaluationHistory,
            Major,
            Program,
            SubjectCombination,
            University,
            Grade10School,
            Grade10District,
            Grade10Quota,
            Grade10Cutoff,
            Grade10History,
            Grade10ImportLog,
            Grade10ActivityLog,
          ],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        } as any;
      },
    }),

    RuleEngineModule,
    UniversityModule,
    RecommendationModule,
    AiAssistantModule,
    ImportModule,
    Grade10HcmModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
