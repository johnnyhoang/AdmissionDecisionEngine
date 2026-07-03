import { Program } from './program.entity';
export declare class Major {
    id: string;
    code: string;
    nameVi: string;
    nameEn: string;
    sector: string;
    description: string;
    careerPath: string;
    requiredSkills: string;
    averageSalary: number;
    employmentRate: number;
    demandTrend: string;
    programs: Program[];
    createdAt: Date;
    updatedAt: Date;
}
