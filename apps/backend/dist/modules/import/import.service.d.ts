import { Repository } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { DataImport } from '../database/entities/data-import.entity';
export interface UniversityImportDto {
    code: string;
    nameVi: string;
    nameEn?: string;
    website?: string;
    description?: string;
    isPublic?: boolean;
    localRanking?: number;
    logoUrl?: string;
    campuses?: CampusImportDto[];
    programs?: ProgramImportDto[];
}
export interface CampusImportDto {
    name: string;
    address?: string;
    city: string;
}
export interface ProgramImportDto {
    majorCode: string;
    name: string;
    trainingType?: string;
    language?: string;
    tuitionFee?: number;
    tuitionFeeMax?: number;
    durationYears?: number;
    totalQuota?: number;
    dataYear?: number;
    dataSource?: string;
    admissionRules?: AdmissionRuleImportDto[];
}
export interface AdmissionRuleImportDto {
    methodCode: string;
    subjectCombination?: string;
    combinationDescription?: string;
    formulaExpression?: string;
    subjectWeights?: Record<string, number>;
    minScoreThreshold?: number;
    quota?: number;
    applyYear?: number;
    benchmarkScores?: BenchmarkScoreImportDto[];
}
export interface BenchmarkScoreImportDto {
    year: number;
    benchmarkScore: number;
    totalAdmitted?: number;
}
export interface ImportPayload {
    sourceName: string;
    sourceUrl?: string;
    dataYear: number;
    universities: UniversityImportDto[];
}
export interface ImportResult {
    importId: string;
    universitiesAdded: number;
    universitiesUpdated: number;
    programsAdded: number;
    programsUpdated: number;
    scoresAdded: number;
    duplicatesSkipped: number;
    warnings: string[];
    errors: string[];
}
export declare class ImportService {
    private readonly universityRepo;
    private readonly campusRepo;
    private readonly majorRepo;
    private readonly programRepo;
    private readonly methodRepo;
    private readonly ruleRepo;
    private readonly scoreRepo;
    private readonly importRepo;
    private readonly logger;
    constructor(universityRepo: Repository<University>, campusRepo: Repository<Campus>, majorRepo: Repository<Major>, programRepo: Repository<Program>, methodRepo: Repository<AdmissionMethod>, ruleRepo: Repository<AdmissionRule>, scoreRepo: Repository<AdmissionScore>, importRepo: Repository<DataImport>);
    importData(payload: ImportPayload): Promise<ImportResult>;
    private upsertUniversity;
    private upsertCampus;
    private upsertProgram;
    private upsertAdmissionRule;
    private ensureMajor;
    private ensureAdmissionMethods;
    private getDefaultFormula;
    private inferMajorName;
    private inferSector;
    private updateUniversityAvgTuition;
    getImportHistory(): Promise<DataImport[]>;
    private resolveDataDir;
    getPresets(): Promise<{
        filename: any;
        sourceName: any;
        sourceUrl: any;
        dataYear: any;
        universitiesCount: any;
        programsCount: number;
        scoresCount: number;
    }[]>;
    runPreset(filename: string): Promise<ImportResult>;
}
