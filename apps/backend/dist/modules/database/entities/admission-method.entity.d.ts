import { AdmissionRule } from './admission-rule.entity';
export declare class AdmissionMethod {
    id: string;
    code: string;
    name: string;
    description: string;
    admissionRules: AdmissionRule[];
    createdAt: Date;
    updatedAt: Date;
}
