import { Grade10SchoolService } from '../services/grade10-school.service';
import { CreateSchoolDto, UpdateSchoolDto } from '../dtos/school-crud.dto';
export declare class Grade10SchoolController {
    private readonly schoolService;
    constructor(schoolService: Grade10SchoolService);
    getSchools(search?: string, districtId?: string, page?: number, limit?: number): Promise<{
        items: {
            latestCutoffNV1: number | null;
            latestCutoffNV2: number | null;
            latestCutoffNV3: number | null;
            latestYear: number | null;
            id: string;
            name: string;
            code: string;
            districtId: string;
            district: import("../entities/district.entity").Grade10District;
            address: string;
            website: string;
            description: string;
            mapUrl: string;
            schoolType: string;
            isActive: boolean;
            quotas: import("../entities/quota.entity").Grade10Quota[];
            cutoffs: import("../entities/cutoff.entity").Grade10Cutoff[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getDistricts(): Promise<import("../entities/district.entity").Grade10District[]>;
    getSchoolNames(q?: string): Promise<{
        id: string;
        name: string;
        code: string;
        districtName?: string;
    }[]>;
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
    getAdminStats(): Promise<{
        schools: number;
        districts: number;
        cutoffs: number;
        quotas: number;
    }>;
    seedAllSchools(): Promise<{
        created: number;
        skipped: number;
    }>;
    getSchoolDetailByCode(code: string): Promise<{
        cutoffScores: {
            cutoffNV1: number;
            cutoffNV2: number | null;
            cutoffNV3: number | null;
            id: string;
            schoolId: string;
            school: import("../entities/school.entity").Grade10School;
            year: number;
            lowestScore: number;
            highestScore: number;
            programType: string;
            notes: string;
            changes: string;
            dataSource: string;
            createdAt: Date;
        }[];
        quotaHistory: import("../entities/quota.entity").Grade10Quota[];
        quotas: import("../entities/quota.entity").Grade10Quota[];
        id: string;
        name: string;
        code: string;
        districtId: string;
        district: import("../entities/district.entity").Grade10District;
        address: string;
        website: string;
        description: string;
        mapUrl: string;
        schoolType: string;
        isActive: boolean;
        cutoffs: import("../entities/cutoff.entity").Grade10Cutoff[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    getSchoolDetail(id: string): Promise<{
        cutoffScores: import("../entities/cutoff.entity").Grade10Cutoff[];
        quotaHistory: import("../entities/quota.entity").Grade10Quota[];
        id: string;
        name: string;
        code: string;
        districtId: string;
        district: import("../entities/district.entity").Grade10District;
        address: string;
        website: string;
        description: string;
        mapUrl: string;
        schoolType: string;
        isActive: boolean;
        quotas: import("../entities/quota.entity").Grade10Quota[];
        cutoffs: import("../entities/cutoff.entity").Grade10Cutoff[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    createSchool(dto: CreateSchoolDto): Promise<import("../entities/school.entity").Grade10School>;
    updateSchool(id: string, dto: UpdateSchoolDto): Promise<import("../entities/school.entity").Grade10School>;
    deleteSchool(id: string): Promise<void>;
}
