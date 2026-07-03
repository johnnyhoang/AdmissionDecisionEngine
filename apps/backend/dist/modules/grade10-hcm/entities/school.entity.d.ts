import { Grade10District } from './district.entity';
import { Grade10Quota } from './quota.entity';
import { Grade10Cutoff } from './cutoff.entity';
export declare class Grade10School {
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
    quotas: Grade10Quota[];
    cutoffs: Grade10Cutoff[];
    createdAt: Date;
    updatedAt: Date;
}
