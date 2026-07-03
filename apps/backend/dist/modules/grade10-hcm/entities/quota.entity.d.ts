import { Grade10School } from './school.entity';
export declare class Grade10Quota {
    id: string;
    schoolId: string;
    school: Grade10School;
    year: number;
    quota: number;
    registeredCount: number;
    competitionRatio: number;
    programType: string;
    createdAt: Date;
}
