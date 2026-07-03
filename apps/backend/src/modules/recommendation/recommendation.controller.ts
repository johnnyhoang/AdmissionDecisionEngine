import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RecommendationService, RecommendationItem } from './recommendation.service';
import { CandidateProfile } from '../database/entities/candidate-profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationHistory } from '../database/entities/evaluation-history.entity';

export class EvaluateProfileDto {
  fullName?: string;
  province?: string;
  region?: string; // KV1, KV2-NT, KV2, KV3
  priorityGroup?: string; // UT1, UT2
  
  // JSON strings or objects
  highSchoolGrades?: Record<string, any>;
  examScores?: Record<string, any>;
  certificates?: Record<string, any>;
  careerInterests?: string[];

  // Optional filters
  tuitionMax?: number;
  isPublic?: boolean;
  city?: string;
  majorSector?: string;
}

export class OptimizePreferencesDto {
  profile: EvaluateProfileDto;
  preferences: Array<{
    programId: string;
    methodCode: string;
    order: number;
  }>;
}

@Controller('api/v1/recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    @InjectRepository(EvaluationHistory)
    private readonly historyRepository: Repository<EvaluationHistory>
  ) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateProfile(
    @Body() dto: EvaluateProfileDto
  ): Promise<RecommendationItem[]> {
    // Construct a transient CandidateProfile entity
    const profile = new CandidateProfile();
    profile.fullName = dto.fullName || 'Thí sinh';
    profile.province = dto.province || '';
    profile.region = dto.region || 'KV3';
    profile.priorityGroup = dto.priorityGroup || '';
    
    // Normalize properties to JSON string representations as stored in the DB
    profile.highSchoolGrades = dto.highSchoolGrades ? JSON.stringify(dto.highSchoolGrades) : '{}';
    profile.examScores = dto.examScores ? JSON.stringify(dto.examScores) : '{}';
    profile.certificates = dto.certificates ? JSON.stringify(dto.certificates) : '{}';
    profile.careerInterests = dto.careerInterests ? JSON.stringify(dto.careerInterests) : '[]';

    // Extract filters
    const filters = {
      tuitionMax: dto.tuitionMax,
      isPublic: dto.isPublic,
      city: dto.city,
      majorSector: dto.majorSector
    };

    const results = await this.recommendationService.getRecommendations(profile, filters);

    // Save evaluation history asynchronously
    try {
      const history = this.historyRepository.create({
        fullName: dto.fullName || 'Thí sinh',
        region: dto.region || 'KV3',
        priorityGroup: dto.priorityGroup || '',
        examScores: JSON.stringify(dto.examScores || {}),
        certificates: JSON.stringify(dto.certificates || {}),
        recommendedCount: results.length
      });
      await this.historyRepository.save(history);
    } catch (err) {
      console.error('Failed to save evaluation log:', err);
    }

    return results;
  }

  @Post('optimize-preferences')
  @HttpCode(HttpStatus.OK)
  async optimizePreferences(
    @Body() dto: OptimizePreferencesDto
  ) {
    const profile = new CandidateProfile();
    profile.fullName = dto.profile.fullName || 'Thí sinh';
    profile.province = dto.profile.province || '';
    profile.region = dto.profile.region || 'KV3';
    profile.priorityGroup = dto.profile.priorityGroup || '';
    profile.highSchoolGrades = dto.profile.highSchoolGrades ? JSON.stringify(dto.profile.highSchoolGrades) : '{}';
    profile.examScores = dto.profile.examScores ? JSON.stringify(dto.profile.examScores) : '{}';
    profile.certificates = dto.profile.certificates ? JSON.stringify(dto.profile.certificates) : '{}';

    return this.recommendationService.optimizePreferences(profile, dto.preferences);
  }
}

