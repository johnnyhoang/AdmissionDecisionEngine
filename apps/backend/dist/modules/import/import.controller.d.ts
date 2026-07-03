import { ImportService, ImportPayload, ImportResult } from './import.service';
import { DataImport } from '../database/entities/data-import.entity';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    importData(payload: ImportPayload): Promise<ImportResult>;
    getHistory(): Promise<DataImport[]>;
    getPresets(): Promise<{
        filename: any;
        sourceName: any;
        sourceUrl: any;
        dataYear: any;
        universitiesCount: any;
        programsCount: number;
        scoresCount: number;
    }[]>;
    runPreset(filename: string): Promise<ImportResult>;
}
