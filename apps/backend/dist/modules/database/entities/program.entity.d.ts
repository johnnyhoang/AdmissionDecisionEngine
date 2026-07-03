import { University } from './university.entity';
import { Major } from './major.entity';
import { Campus } from './campus.entity';
import { AdmissionRule } from './admission-rule.entity';
export declare enum TrainingType {
    DAI_TRA = "DAI_TRA",
    CHAT_LUONG_CAO = "CHAT_LUONG_CAO",
    TIEN_TIEN = "TIEN_TIEN",
    LIEN_KET_NUOC_NGOAI = "LIEN_KET_NUOC_NGOAI",
    POHE = "POHE",
    TAI_NANG = "TAI_NANG",
    VIET_PHAP = "VIET_PHAP"
}
export declare class Program {
    id: string;
    universityId: string;
    majorId: string;
    campusId: string;
    majorCode: string;
    code: string;
    name: string;
    trainingType: string;
    language: string;
    tuitionFee: number;
    tuitionFeeMax: number;
    durationYears: number;
    totalQuota: number;
    dataYear: number;
    dataSource: string;
    isActive: boolean;
    university: University;
    major: Major;
    campus: Campus;
    admissionRules: AdmissionRule[];
    createdAt: Date;
    updatedAt: Date;
}
