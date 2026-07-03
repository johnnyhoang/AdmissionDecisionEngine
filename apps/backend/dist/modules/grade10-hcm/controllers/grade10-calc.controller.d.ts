import { Grade10CalcService } from '../services/grade10-calc.service';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';
export declare class Grade10CalcController {
    private readonly calcService;
    constructor(calcService: Grade10CalcService);
    calculate(dto: CalculateScoreDto): Promise<{
        finalScore: number;
    }>;
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
