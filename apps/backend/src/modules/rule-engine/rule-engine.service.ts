import { Injectable } from '@nestjs/common';
import { FormulaParserService } from './formula-parser.service';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { CandidateProfile } from '../database/entities/candidate-profile.entity';

export interface EvaluationResult {
  candidateScore: number;
  isEligible: boolean;
  minScoreThreshold: number;
  breakdown: Record<string, number>;
}

@Injectable()
export class RuleEngineService {
  constructor(private readonly formulaParser: FormulaParserService) {}

  /**
   * Evaluates if a student profile meets the criteria for a specific admission rule
   * and calculates the total evaluation score.
   */
  evaluate(profile: CandidateProfile, rule: AdmissionRule): EvaluationResult {
    // 1. Parse Candidate Profile JSON data
    const examScores = profile.examScores ? JSON.parse(profile.examScores) : {};
    const highSchoolGrades = profile.highSchoolGrades
      ? JSON.parse(profile.highSchoolGrades)
      : {};
    const certificates = profile.certificates
      ? JSON.parse(profile.certificates)
      : {};

    // 2. Parse Rule Configs JSON data
    const subjectWeights = rule.subjectWeights
      ? JSON.parse(rule.subjectWeights)
      : {};
    const priorityRules = rule.priorityRules
      ? JSON.parse(rule.priorityRules)
      : {};

    // 3. Build context for formula parser
    const context: Record<string, number> = {};

    // Initialize core subjects to 0 (default fallback)
    const allSubjects = [
      'Math',
      'Physics',
      'Chemistry',
      'Biology',
      'Literature',
      'History',
      'Geography',
      'English',
      'Civics',
    ];
    for (const sub of allSubjects) {
      context[sub] = 0;
    }

    const methodCode = rule.admissionMethod?.code || '';

    // Populate score contexts based on Method Type
    if (methodCode === 'THPT') {
      const thptScores = examScores.THPT || {};
      for (const sub of Object.keys(thptScores)) {
        context[sub] = Number(thptScores[sub]) || 0;
      }
    } else if (methodCode === 'HOCBA') {
      // Expect transcript average grades
      const averages = highSchoolGrades.Average || {};
      for (const sub of Object.keys(averages)) {
        context[sub] = Number(averages[sub]) || 0;
      }
    } else if (methodCode.startsWith('DGNL')) {
      // HCM uses 1200 scale, HN uses 150 scale
      context['DGNL'] =
        Number(examScores[methodCode]) ||
        Number(examScores.DGNL_HCM) ||
        Number(examScores.DGNL_HN) ||
        0;
    } else if (methodCode === 'VSAT') {
      context['VSAT'] = Number(examScores.VSAT) || 0;
    }

    // Apply subject coefficients (e.g., if weight for Math is 2, then Math becomes Math * 2)
    for (const sub of Object.keys(subjectWeights)) {
      if (context[sub] !== undefined) {
        context[sub] = context[sub] * Number(subjectWeights[sub]);
      }
    }

    // 4. Calculate Priority/Bonus Points
    let regionBonus = 0;
    if (profile.region) {
      // Standard regional bonus in Vietnam (e.g., KV1: 0.75, KV2-NT: 0.5, KV2: 0.25, KV3: 0.0)
      const regionPoints: Record<string, number> = {
        KV1: 0.75,
        'KV2-NT': 0.5,
        KV2: 0.25,
        KV3: 0.0,
      };
      regionBonus = regionPoints[profile.region] ?? 0;
    }

    let policyBonus = 0;
    if (profile.priorityGroup) {
      // Standard policy groups (UT1: 2.0, UT2: 1.0)
      const policyPoints: Record<string, number> = {
        UT1: 2.0,
        UT2: 1.0,
      };
      policyBonus = policyPoints[profile.priorityGroup] ?? 0;
    }

    // IELTS/TOEFL bonus points configuration if applicable
    let certificateBonus = 0;
    if (certificates.IELTS) {
      const ieltsVal = Number(certificates.IELTS);
      // Map IELTS levels to bonus points based on university rule settings
      // Example rule: {"IELTS_6.0": 0.5, "IELTS_6.5": 1.0, "IELTS_7.0": 1.5, "IELTS_7.5_UP": 2.0}
      if (ieltsVal >= 7.5 && priorityRules['IELTS_7.5_UP'])
        certificateBonus = Number(priorityRules['IELTS_7.5_UP']);
      else if (ieltsVal >= 7.0 && priorityRules['IELTS_7.0'])
        certificateBonus = Number(priorityRules['IELTS_7.0']);
      else if (ieltsVal >= 6.5 && priorityRules['IELTS_6.5'])
        certificateBonus = Number(priorityRules['IELTS_6.5']);
      else if (ieltsVal >= 6.0 && priorityRules['IELTS_6.0'])
        certificateBonus = Number(priorityRules['IELTS_6.0']);
    }

    // Combined Priority Bonus
    const totalPriorityBonus = regionBonus + policyBonus + certificateBonus;
    context['PriorityBonus'] = totalPriorityBonus;

    // 5. Evaluate the Formula Expression
    const formula = rule.formulaExpression || 'Math + Physics + Chemistry';
    const computedScore = this.formulaParser.evaluate(formula, context);

    // 6. Check eligibility (must be >= minScoreThreshold)
    const threshold = Number(rule.minScoreThreshold) || 0;
    const isEligible = computedScore >= threshold;

    return {
      candidateScore: parseFloat(computedScore.toFixed(2)),
      isEligible,
      minScoreThreshold: threshold,
      breakdown: {
        rawScore: parseFloat((computedScore - totalPriorityBonus).toFixed(2)),
        priorityBonus: totalPriorityBonus,
        regionBonus,
        policyBonus,
        certificateBonus,
      },
    };
  }
}
