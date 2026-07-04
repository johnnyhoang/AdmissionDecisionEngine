export declare class CreateSchoolDto {
    name: string;
    code: string;
    districtId?: string;
    address?: string;
    website?: string;
    description?: string;
    mapUrl?: string;
    schoolType?: string;
    isActive?: boolean;
    isVerified?: boolean;
    comments?: string;
    latitude?: number;
    longitude?: number;
}
export declare class UpdateSchoolDto {
    name?: string;
    code?: string;
    districtId?: string;
    address?: string;
    website?: string;
    description?: string;
    mapUrl?: string;
    schoolType?: string;
    isActive?: boolean;
    isVerified?: boolean;
    comments?: string;
    latitude?: number;
    longitude?: number;
    cutoffs?: any[];
    quotas?: any[];
}
