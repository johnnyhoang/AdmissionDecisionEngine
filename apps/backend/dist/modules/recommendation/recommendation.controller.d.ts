import { RecommendationService, RecommendationItem } from './recommendation.service';
import { Repository } from 'typeorm';
import { EvaluationHistory } from '../database/entities/evaluation-history.entity';
export declare class EvaluateProfileDto {
    fullName?: string;
    province?: string;
    region?: string;
    priorityGroup?: string;
    highSchoolGrades?: Record<string, any>;
    examScores?: Record<string, any>;
    certificates?: Record<string, any>;
    careerInterests?: string[];
    tuitionMax?: number;
    isPublic?: boolean;
    city?: string;
    majorSector?: string;
}
export declare class OptimizePreferencesDto {
    profile: EvaluateProfileDto;
    preferences: Array<{
        programId: string;
        methodCode: string;
        order: number;
    }>;
}
export declare class RecommendationController {
    private readonly recommendationService;
    private readonly historyRepository;
    constructor(recommendationService: RecommendationService, historyRepository: Repository<EvaluationHistory>);
    evaluateProfile(dto: EvaluateProfileDto): Promise<RecommendationItem[]>;
    optimizePreferences(dto: OptimizePreferencesDto): Promise<{
        optimizedList: any[];
        warnings: string[];
    }>;
}
