import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { University } from '../database/entities/university.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { Grade10School } from '../grade10-hcm/entities/school.entity';
import { Grade10District } from '../grade10-hcm/entities/district.entity';
import { Grade10Cutoff } from '../grade10-hcm/entities/cutoff.entity';
import { Grade10Quota } from '../grade10-hcm/entities/quota.entity';
import { SearchCutoffsDto, ImportCutoffsDto } from './ai-assistant.controller';
export declare class AiAssistantService {
    private readonly configService;
    private readonly universityRepository;
    private readonly majorRepository;
    private readonly programRepository;
    private readonly methodRepository;
    private readonly ruleRepository;
    private readonly scoreRepository;
    private readonly grade10SchoolRepo;
    private readonly grade10DistrictRepo;
    private readonly grade10CutoffRepo;
    private readonly grade10QuotaRepo;
    constructor(configService: ConfigService, universityRepository: Repository<University>, majorRepository: Repository<Major>, programRepository: Repository<Program>, methodRepository: Repository<AdmissionMethod>, ruleRepository: Repository<AdmissionRule>, scoreRepository: Repository<AdmissionScore>, grade10SchoolRepo: Repository<Grade10School>, grade10DistrictRepo: Repository<Grade10District>, grade10CutoffRepo: Repository<Grade10Cutoff>, grade10QuotaRepo: Repository<Grade10Quota>);
    chat(message: string): Promise<{
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
    private fetchWebSearch;
    private callGeminiSearch;
    private parseJsonWithGemini;
    private callOpenAI;
    private callClaude;
    private callGroq;
    private getSchema;
    private compareWithDatabase;
    importCutoffs(dto: ImportCutoffsDto): Promise<{
        success: boolean;
        importedCount: number;
    }>;
}
