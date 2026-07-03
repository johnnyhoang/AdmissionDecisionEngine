import { FormulaParserService } from './formula-parser.service';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { CandidateProfile } from '../database/entities/candidate-profile.entity';
export interface EvaluationResult {
    candidateScore: number;
    isEligible: boolean;
    minScoreThreshold: number;
    breakdown: Record<string, number>;
}
export declare class RuleEngineService {
    private readonly formulaParser;
    constructor(formulaParser: FormulaParserService);
    evaluate(profile: CandidateProfile, rule: AdmissionRule): EvaluationResult;
}
