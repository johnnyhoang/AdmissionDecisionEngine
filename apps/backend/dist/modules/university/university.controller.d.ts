import { UniversityService } from './university.service';
export declare class UniversityController {
    private readonly universityService;
    constructor(universityService: UniversityService);
    getUniversities(search?: string, city?: string, isPublic?: string, page?: string, limit?: string): Promise<{
        items: import("../database/entities/university.entity").University[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUniversityById(id: string): Promise<import("../database/entities/university.entity").University | null>;
    getMajors(search?: string, sector?: string): Promise<import("../database/entities/major.entity").Major[]>;
    getMajorAnalytics(code: string): Promise<{
        year: number;
        avgBenchmark: number;
    }[]>;
    seedMethods(): Promise<{
        message: string;
    }>;
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
    getHistories(): Promise<import("../database/entities/evaluation-history.entity").EvaluationHistory[]>;
}
