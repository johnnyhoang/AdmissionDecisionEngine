import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';
export declare class Grade10SchoolService {
    private readonly schoolRepo;
    private readonly districtRepo;
    private readonly quotaRepo;
    private readonly cutoffRepo;
    constructor(schoolRepo: Repository<Grade10School>, districtRepo: Repository<Grade10District>, quotaRepo: Repository<Grade10Quota>, cutoffRepo: Repository<Grade10Cutoff>);
    findAll(filters: {
        search?: string;
        districtId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            latestCutoffNV1: number | null;
            latestCutoffNV2: number | null;
            latestCutoffNV3: number | null;
            latestYear: number | null;
            id: string;
            name: string;
            code: string;
            districtId: string;
            district: Grade10District;
            address: string;
            website: string;
            description: string;
            mapUrl: string;
            schoolType: string;
            isActive: boolean;
            isVerified: boolean;
            latitude: number;
            longitude: number;
            quotas: Grade10Quota[];
            cutoffs: Grade10Cutoff[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<{
        cutoffScores: Grade10Cutoff[];
        quotaHistory: Grade10Quota[];
        id: string;
        name: string;
        code: string;
        districtId: string;
        district: Grade10District;
        address: string;
        website: string;
        description: string;
        mapUrl: string;
        schoolType: string;
        isActive: boolean;
        isVerified: boolean;
        latitude: number;
        longitude: number;
        quotas: Grade10Quota[];
        cutoffs: Grade10Cutoff[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByCode(code: string): Promise<{
        cutoffScores: {
            cutoffNV1: number;
            cutoffNV2: number | null;
            cutoffNV3: number | null;
            id: string;
            schoolId: string;
            school: Grade10School;
            year: number;
            lowestScore: number;
            highestScore: number;
            programType: string;
            notes: string;
            changes: string;
            dataSource: string;
            createdAt: Date;
        }[];
        quotaHistory: Grade10Quota[];
        quotas: Grade10Quota[];
        id: string;
        name: string;
        code: string;
        districtId: string;
        district: Grade10District;
        address: string;
        website: string;
        description: string;
        mapUrl: string;
        schoolType: string;
        isActive: boolean;
        isVerified: boolean;
        latitude: number;
        longitude: number;
        cutoffs: Grade10Cutoff[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    createSchool(dto: CreateSchoolDto): Promise<Grade10School>;
    updateSchool(id: string, dto: UpdateSchoolDto): Promise<Grade10School>;
    deleteSchool(id: string): Promise<boolean>;
    getDistricts(): Promise<Grade10District[]>;
    getAdminStats(): Promise<{
        schools: number;
        districts: number;
        cutoffs: number;
        quotas: number;
    }>;
    getAnalytics(): Promise<{
        latestYear: any;
        topSchools: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            cutoffNV1: number;
            year: number;
        }[];
        bottomSchools: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            cutoffNV1: number;
            year: number;
        }[];
        topQuota: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            quota: number;
            year: number;
        }[];
        topRatio: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            ratio: number;
            year: number;
        }[];
        bottomRatio: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            ratio: number;
            year: number;
        }[];
        topIncrease: {
            schoolId: any;
            schoolName: any;
            schoolCode: any;
            districtName: any;
            cutoffNew: number;
            cutoffOld: number;
            diff: number;
        }[];
        topRegistered: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            registeredCount: number;
            year: number;
        }[];
        topSpecialized: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            cutoffNV1: number;
            year: number;
        }[];
        topDecrease: {
            schoolId: any;
            schoolName: any;
            schoolCode: any;
            districtName: any;
            cutoffNew: number;
            cutoffOld: number;
            diff: number;
        }[];
        topNV3Gap: {
            schoolId: string;
            schoolName: string;
            schoolCode: string;
            districtName: string;
            cutoffNV1: number;
            cutoffNV3: number;
            gap: number;
            year: number;
        }[];
        districtAverages: {
            districtName: any;
            avgCutoff: number;
            schoolCount: number;
        }[];
        trends: {
            year: number;
            totalQuota: number;
            totalRegistered: number;
            avgCompetitionRatio: number;
        }[];
    }>;
    getSchoolNames(query?: string): Promise<{
        id: string;
        name: string;
        code: string;
        districtName?: string;
    }[]>;
    seedAllSchools(): Promise<{
        created: number;
        skipped: number;
    }>;
    mergeSchools(primaryId: string, secondaryId: string, mergedData: any): Promise<Grade10School>;
}
