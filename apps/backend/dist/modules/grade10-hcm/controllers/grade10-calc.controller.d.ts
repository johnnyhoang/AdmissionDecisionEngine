import { Request } from 'express';
import { Grade10CalcService } from '../services/grade10-calc.service';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto, GetComboRecommendationDto } from '../dtos/recommendation.dto';
export declare class Grade10CalcController {
    private readonly calcService;
    constructor(calcService: Grade10CalcService);
    getMacroConfig(): Promise<any>;
    updateMacroConfig(body: any): Promise<any>;
    calculate(dto: CalculateScoreDto): Promise<{
        finalScore: number;
    }>;
    getRecommendations(dto: GetRecommendationDto, req: Request): Promise<{
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
            safetyCategory: "VERY_SAFE" | "SAFE" | "COMPETITIVE" | "RISKY" | "VERY_RISKY";
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
    getComboRecommendations(dto: GetComboRecommendationDto, req: Request): Promise<{
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
