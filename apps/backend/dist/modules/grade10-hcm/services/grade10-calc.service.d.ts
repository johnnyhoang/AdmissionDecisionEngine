import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { Grade10History } from '../entities/history.entity';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';
export declare class Grade10CalcService {
    private readonly schoolRepo;
    private readonly cutoffRepo;
    private readonly historyRepo;
    constructor(schoolRepo: Repository<Grade10School>, cutoffRepo: Repository<Grade10Cutoff>, historyRepo: Repository<Grade10History>);
    calculateScore(dto: CalculateScoreDto): number;
    getRecommendations(dto: GetRecommendationDto): Promise<{
        candidateScore: number;
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
}
