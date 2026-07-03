import { Repository } from 'typeorm';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { Program } from '../database/entities/program.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { CandidateProfile } from '../database/entities/candidate-profile.entity';
export interface RecommendationItem {
    programId: string;
    programCode: string;
    programName: string;
    universityCode: string;
    universityName: string;
    campusName: string;
    tuitionFee: number;
    language: string;
    admissionMethod: string;
    candidateScore: number;
    benchmarkScoreLastYear: number;
    minScoreThreshold: number;
    admissionProbability: number;
    probabilityCategory: 'SAFE' | 'MATCH' | 'REACH' | 'LOW';
    explanation: string;
    breakdown: any;
}
export declare class RecommendationService {
    private readonly programRepository;
    private readonly ruleRepository;
    private readonly ruleEngineService;
    constructor(programRepository: Repository<Program>, ruleRepository: Repository<AdmissionRule>, ruleEngineService: RuleEngineService);
    getRecommendations(profile: CandidateProfile, filters?: {
        tuitionMax?: number;
        isPublic?: boolean;
        city?: string;
        majorSector?: string;
    }): Promise<RecommendationItem[]>;
    private calculateProbability;
    optimizePreferences(profile: CandidateProfile, preferences: Array<{
        programId: string;
        methodCode: string;
        order: number;
    }>): Promise<{
        optimizedList: any[];
        warnings: string[];
    }>;
}
