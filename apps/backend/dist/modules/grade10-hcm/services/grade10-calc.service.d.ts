import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { Grade10History } from '../entities/history.entity';
import { Grade10ActivityLog } from '../entities/activity-log.entity';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';
export declare class Grade10CalcService {
    private readonly schoolRepo;
    private readonly cutoffRepo;
    private readonly historyRepo;
    private readonly activityLogRepo;
    constructor(schoolRepo: Repository<Grade10School>, cutoffRepo: Repository<Grade10Cutoff>, historyRepo: Repository<Grade10History>, activityLogRepo: Repository<Grade10ActivityLog>);
    private getMacroConfigPath;
    getMacroConfig(): any;
    updateMacroConfig(data: any): any;
    calculateScore(dto: CalculateScoreDto): number;
    getRecommendations(dto: GetRecommendationDto, context?: {
        userId?: string | null;
        userName?: string | null;
        userAgent?: string | null;
        ipAddress?: string | null;
    }): Promise<{
        candidateScore: number;
        shiftedScore: number;
        ssf: any;
        macroConfig: any;
        details: {
            math: number;
            literature: number;
            english: number;
            priority: number;
            bonus: number;
        };
        recommendations: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            cutoffNV1: number;
            cutoffNV2: number | null;
            cutoffNV3: number | null;
            diff: number;
            d1: number;
            d2: number;
            d3: number;
            d4: number;
            nv2Gap: number | null;
            nv3Gap: number | null;
            safetyCategory: "SAFE" | "VERY_SAFE" | "COMPETITIVE" | "RISKY" | "VERY_RISKY";
            trend: "UP" | "DOWN" | "STABLE";
            advice: string;
            probability: number;
            historicalAvg: number;
            last3YearsScores: {
                year: number;
                score: number;
            }[];
        }[];
    }>;
    getComboRecommendations(dto: any, context?: {
        userId?: string | null;
        userName?: string | null;
        userAgent?: string | null;
        ipAddress?: string | null;
    }): Promise<{
        minScore: number;
        maxScore: number;
        avgScore: number;
        combos: any;
        explanations: any;
        ssf: any;
        macroConfig: any;
        maxCommuteDistance: number;
        adjusted: boolean;
    }>;
}
