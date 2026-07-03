import { Grade10School } from './school.entity';
export declare class Grade10Cutoff {
    id: string;
    schoolId: string;
    school: Grade10School;
    year: number;
    cutoffNV1: number;
    cutoffNV2: number | null;
    cutoffNV3: number | null;
    lowestScore: number;
    highestScore: number;
    programType: string;
    notes: string;
    changes: string;
    dataSource: string;
    createdAt: Date;
}
