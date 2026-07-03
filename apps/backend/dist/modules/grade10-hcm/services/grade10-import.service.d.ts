import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { Grade10ImportLog } from '../entities/import-log.entity';
export interface ImportQuotaDto {
    year: number;
    quota: number;
    registeredCount?: number;
    competitionRatio?: number;
    programType?: string;
}
export interface ImportCutoffDto {
    year: number;
    cutoffNV1: number;
    cutoffNV2?: number;
    cutoffNV3?: number;
    lowestScore?: number;
    highestScore?: number;
    programType?: string;
    notes?: string;
    changes?: string;
    dataSource?: string;
}
export interface ImportSchoolDto {
    code: string;
    name: string;
    address?: string;
    website?: string;
    description?: string;
    mapUrl?: string;
    schoolType?: string;
    quotas?: ImportQuotaDto[];
    cutoffs?: ImportCutoffDto[];
}
export interface ImportDistrictDto {
    code: string;
    name: string;
    schools: ImportSchoolDto[];
}
export interface Grade10ImportPayload {
    sourceName: string;
    sourceUrl?: string;
    dataYear: number;
    districts: ImportDistrictDto[];
}
export declare class Grade10ImportService {
    private readonly schoolRepo;
    private readonly districtRepo;
    private readonly quotaRepo;
    private readonly cutoffRepo;
    private readonly logRepo;
    private readonly logger;
    constructor(schoolRepo: Repository<Grade10School>, districtRepo: Repository<Grade10District>, quotaRepo: Repository<Grade10Quota>, cutoffRepo: Repository<Grade10Cutoff>, logRepo: Repository<Grade10ImportLog>);
    private resolveDataDir;
    getPresets(): Promise<{
        filename: any;
        sourceName: string;
        sourceUrl: string | undefined;
        dataYear: number;
        districtsCount: number;
        schoolsCount: number;
        quotasCount: number;
        cutoffsCount: number;
    }[]>;
    runPreset(filename: string): Promise<{
        schoolsAdded: number;
        schoolsUpdated: number;
        quotasAdded: number;
        cutoffsAdded: number;
        errors: string[];
    }>;
    importData(payload: Grade10ImportPayload): Promise<{
        schoolsAdded: number;
        schoolsUpdated: number;
        quotasAdded: number;
        cutoffsAdded: number;
        errors: string[];
    }>;
    getImportHistory(): Promise<Grade10ImportLog[]>;
}
