import { Grade10ImportService, Grade10ImportPayload } from '../services/grade10-import.service';
export declare class Grade10AdminController {
    private readonly importService;
    constructor(importService: Grade10ImportService);
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
    getHistory(): Promise<import("../entities/import-log.entity").Grade10ImportLog[]>;
    importData(payload: Grade10ImportPayload): Promise<{
        schoolsAdded: number;
        schoolsUpdated: number;
        quotasAdded: number;
        cutoffsAdded: number;
        errors: string[];
    }>;
}
