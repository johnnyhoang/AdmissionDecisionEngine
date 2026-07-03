import { AiAssistantService } from './ai-assistant.service';
export declare class ChatMessageDto {
    message: string;
}
export declare class SearchCutoffsDto {
    type: 'GRADE10' | 'UNIVERSITY';
    schoolQuery: string;
    majorQuery?: string;
    schoolCode?: string;
    districtName?: string;
    districtCode?: string;
}
export declare class ImportCutoffsDto {
    type: 'GRADE10' | 'UNIVERSITY';
    schoolCode: string;
    majorCode?: string;
    districtName?: string;
    overrides: any[];
}
export declare class AiAssistantController {
    private readonly aiAssistantService;
    constructor(aiAssistantService: AiAssistantService);
    chat(dto: ChatMessageDto): Promise<{
        reply: string;
        data?: any;
    }>;
    searchCutoffs(dto: SearchCutoffsDto): Promise<{
        schoolName: string;
        schoolCode: string;
        type: string;
        results: any;
        majorName?: undefined;
        majorCode?: undefined;
    } | {
        schoolName: string;
        schoolCode: string;
        majorName: any;
        majorCode: any;
        type: string;
        results: any;
    }>;
    importCutoffs(dto: ImportCutoffsDto): Promise<{
        success: boolean;
        importedCount: number;
    }>;
}
