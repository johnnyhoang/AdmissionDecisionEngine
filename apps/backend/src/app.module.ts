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
          host: url ? undefined : config.get<string>('DB_HOST', 'aws-1-ap-southeast-1.pooler.supabase.com'),
          port: url ? undefined : config.get<number>('DB_PORT', 5432),
          username: url ? undefined : config.get<string>('DB_USERNAME', 'postgres.czngbleeeiljsrpbaksg'),
          password: url ? undefined : config.get<string>('DB_PASSWORD', ''),
          database: url ? undefined : config.get<string>('DB_DATABASE', 'postgres'),
          autoLoadEntities: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
