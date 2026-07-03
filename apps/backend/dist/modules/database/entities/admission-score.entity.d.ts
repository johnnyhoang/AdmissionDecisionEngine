import { AdmissionRule } from './admission-rule.entity';
export declare class AdmissionScore {
    id: string;
    admissionRuleId: string;
    year: number;
    benchmarkScore: number;
    totalAdmitted: number;
    admissionRule: AdmissionRule;
    createdAt: Date;
    updatedAt: Date;
}
