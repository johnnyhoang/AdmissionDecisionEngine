import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { University } from '../database/entities/university.entity';
import { Major } from '../database/entities/major.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([University, Major, AdmissionScore]),
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
