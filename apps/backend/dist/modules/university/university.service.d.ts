import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { University } from '../database/entities/university.entity';
import { Campus } from '../database/entities/campus.entity';
import { Major } from '../database/entities/major.entity';
import { Program } from '../database/entities/program.entity';
import { AdmissionMethod } from '../database/entities/admission-method.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';
import { EvaluationHistory } from '../database/entities/evaluation-history.entity';
import { DataImport } from '../database/entities/data-import.entity';
export declare class UniversityService implements OnApplicationBootstrap {
    private readonly universityRepository;
    private readonly campusRepository;
    private readonly majorRepository;
    private readonly programRepository;
    private readonly methodRepository;
    private readonly ruleRepository;
    private readonly scoreRepository;
    private readonly historyRepository;
    private readonly dataImportRepository;
    constructor(universityRepository: Repository<University>, campusRepository: Repository<Campus>, majorRepository: Repository<Major>, programRepository: Repository<Program>, methodRepository: Repository<AdmissionMethod>, ruleRepository: Repository<AdmissionRule>, scoreRepository: Repository<AdmissionScore>, historyRepository: Repository<EvaluationHistory>, dataImportRepository: Repository<DataImport>);
    onApplicationBootstrap(): Promise<void>;
    seedAdmissionMethodsIfMissing(): Promise<void>;
    findAll(filters: {
        search?: string;
        city?: string;
        isPublic?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        items: University[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<University | null>;
    findMajors(search?: string, sector?: string): Promise<Major[]>;
    getMajorAnalytics(majorCode: string): Promise<{
        year: number;
        avgBenchmark: number;
    }[]>;
    seedInitialData(): Promise<void>;
    getStats(): Promise<{
        universities: number;
        campuses: number;
        majors: number;
        programs: number;
        methods: number;
        rules: number;
        scores: number;
        histories: number;
        imports: number;
    }>;
    getEvaluationHistory(): Promise<EvaluationHistory[]>;
}
