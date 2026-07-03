import { Campus } from './campus.entity';
import { Program } from './program.entity';
export declare class University {
    id: string;
    code: string;
    nameVi: string;
    nameEn: string;
    logoUrl: string;
    description: string;
    website: string;
    globalRanking: number;
    localRanking: number;
    averageTuition: number;
    isPublic: boolean;
    campuses: Campus[];
    programs: Program[];
    createdAt: Date;
    updatedAt: Date;
}
