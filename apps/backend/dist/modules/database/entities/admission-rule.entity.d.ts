import { Program } from './program.entity';
import { AdmissionMethod } from './admission-method.entity';
import { AdmissionScore } from './admission-score.entity';
export declare class AdmissionRule {
    id: string;
    programId: string;
    admissionMethodId: string;
    subjectCombination: string;
    combinationDescription: string;
    formulaExpression: string;
    subjectWeights: string;
    minScoreThreshold: number;
    priorityRules: string;
    quota: number;
    applyYear: number;
    program: Program;
    admissionMethod: AdmissionMethod;
    admissionScores: AdmissionScore[];
    createdAt: Date;
    updatedAt: Date;
}
