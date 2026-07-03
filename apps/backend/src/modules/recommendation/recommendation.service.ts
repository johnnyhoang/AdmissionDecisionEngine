import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { Program } from '../database/entities/program.entity';
import { AdmissionRule } from '../database/entities/admission-rule.entity';
import { CandidateProfile } from '../database/entities/candidate-profile.entity';
import { AdmissionScore } from '../database/entities/admission-score.entity';

export interface RecommendationItem {
  programId: string;
  programCode: string;
  programName: string;
  universityCode: string;
  universityName: string;
  campusName: string;
  tuitionFee: number;
  language: string;
  admissionMethod: string;
  candidateScore: number;
  benchmarkScoreLastYear: number;
  minScoreThreshold: number;
  admissionProbability: number; // percentage: 0 to 100
  probabilityCategory: 'SAFE' | 'MATCH' | 'REACH' | 'LOW';
  explanation: string;
  breakdown: any;
}

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(AdmissionRule)
    private readonly ruleRepository: Repository<AdmissionRule>,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  /**
   * Generates a list of recommended university programs and admission methods based on student profile.
   */
  async getRecommendations(
    profile: CandidateProfile,
    filters?: {
      tuitionMax?: number;
      isPublic?: boolean;
      city?: string;
      majorSector?: string;
    },
  ): Promise<RecommendationItem[]> {
    // 1. Fetch programs with rules, university, campus, major details
    const query = this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.university', 'university')
      .leftJoinAndSelect('program.campus', 'campus')
      .leftJoinAndSelect('program.major', 'major')
      .leftJoinAndSelect('program.admissionRules', 'rule')
      .leftJoinAndSelect('rule.admissionMethod', 'method')
      .leftJoinAndSelect('rule.admissionScores', 'score');

    if (filters?.tuitionMax) {
      query.andWhere('program.tuitionFee <= :tuitionMax', {
        tuitionMax: filters.tuitionMax,
      });
    }
    if (filters?.isPublic !== undefined) {
      query.andWhere('university.isPublic = :isPublic', {
        isPublic: filters.isPublic,
      });
    }
    if (filters?.city) {
      query.andWhere('campus.city = :city', { city: filters.city });
    }
    if (filters?.majorSector) {
      query.andWhere('major.sector = :sector', { sector: filters.majorSector });
    }

    const programs = await query.getMany();
    const recommendations: RecommendationItem[] = [];

    // 2. Evaluate each program's rules against student profile
    for (const program of programs) {
      for (const rule of program.admissionRules) {
        try {
          const evalResult = this.ruleEngineService.evaluate(profile, rule);
          if (!evalResult.isEligible) {
            continue; // Skip if student score doesn't meet the absolute minimum floor (điểm sàn)
          }

          // Fetch the latest year's benchmark score (usually 2025 or most recent recorded score)
          const scores = rule.admissionScores || [];
          const sortedScores = [...scores].sort((a, b) => b.year - a.year);
          const lastYearScoreRecord = sortedScores[0];
          const lastYearBenchmark = lastYearScoreRecord
            ? Number(lastYearScoreRecord.benchmarkScore)
            : 0;

          // Estimate probability based on score comparison
          const { probability, category, explanation } =
            this.calculateProbability(
              evalResult.candidateScore,
              lastYearBenchmark,
              rule.minScoreThreshold,
              rule.admissionMethod?.code || '',
            );

          recommendations.push({
            programId: program.id,
            programCode: program.code,
            programName: program.name,
            universityCode: program.university.code,
            universityName: program.university.nameVi,
            campusName: program.campus.name,
            tuitionFee: Number(program.tuitionFee),
            language: program.language,
            admissionMethod: rule.admissionMethod?.name || 'Xét tuyển',
            candidateScore: evalResult.candidateScore,
            benchmarkScoreLastYear: lastYearBenchmark,
            minScoreThreshold: Number(rule.minScoreThreshold),
            admissionProbability: probability,
            probabilityCategory: category,
            explanation,
            breakdown: evalResult.breakdown,
          });
        } catch (err) {
          // Keep processing other rules if one has parsing error (due to mismatched profile context)
          continue;
        }
      }
    }

    // Sort by: Probability (SAFE -> MATCH -> REACH), then Candidate Score descending
    const categoryOrder = { SAFE: 1, MATCH: 2, REACH: 3, LOW: 4 };
    return recommendations.sort((a, b) => {
      const orderDiff =
        categoryOrder[a.probabilityCategory] -
        categoryOrder[b.probabilityCategory];
      if (orderDiff !== 0) return orderDiff;
      return b.candidateScore - a.candidateScore;
    });
  }

  /**
   * Helper algorithm to calculate the probability of admission and generate explanations in Vietnamese.
   */
  private calculateProbability(
    candidateScore: number,
    lastYearBenchmark: number,
    minThreshold: number,
    methodCode: string,
  ): {
    probability: number;
    category: 'SAFE' | 'MATCH' | 'REACH' | 'LOW';
    explanation: string;
  } {
    // Default fallback if no benchmark score exists yet
    if (lastYearBenchmark === 0) {
      return {
        probability: 60,
        category: 'MATCH',
        explanation: `Điểm của bạn (${candidateScore}) đạt điểm sàn tối thiểu (${minThreshold}). Chưa có dữ liệu điểm chuẩn năm trước.`,
      };
    }

    const diff = candidateScore - lastYearBenchmark;

    // Scale difference factors depending on the exam score scale (e.g. THPT is max 30, DGNL HCM is max 1200)
    let marginSafe = 1.5;
    let marginReach = -1.0;

    if (methodCode.includes('DGNL') && lastYearBenchmark > 150) {
      // DGNL HCM (1200 scale)
      marginSafe = 50;
      marginReach = -40;
    } else if (methodCode.includes('DGNL') && lastYearBenchmark <= 150) {
      // DGNL HN (150 scale)
      marginSafe = 10;
      marginReach = -8;
    }

    if (diff >= marginSafe) {
      const percent = Math.min(99, 95 + (diff - marginSafe) * 0.5);
      return {
        probability: parseFloat(percent.toFixed(0)),
        category: 'SAFE',
        explanation: `Khả năng trúng tuyển RẤT CAO. Điểm của bạn (${candidateScore}) vượt điểm chuẩn năm ngoái (${lastYearBenchmark}) là ${diff.toFixed(2)} điểm.`,
      };
    } else if (diff >= 0) {
      // Candidate score is equal or slightly higher than last year
      const ratio = diff / marginSafe;
      const percent = 75 + ratio * 20;
      return {
        probability: parseFloat(percent.toFixed(0)),
        category: 'MATCH',
        explanation: `Cơ hội trúng tuyển TỐT. Điểm của bạn (${candidateScore}) bằng hoặc cao hơn một chút so với điểm chuẩn năm ngoái (${lastYearBenchmark}).`,
      };
    } else if (diff >= marginReach) {
      // Candidate score is slightly lower than last year
      const ratio = (diff - marginReach) / Math.abs(marginReach);
      const percent = 45 + ratio * 30;
      return {
        probability: parseFloat(percent.toFixed(0)),
        category: 'REACH',
        explanation: `Có cơ hội nhưng CẦN CÂN NHẮC. Điểm của bạn (${candidateScore}) thấp hơn điểm chuẩn năm ngoái (${lastYearBenchmark}) một chút (${Math.abs(diff).toFixed(2)} điểm).`,
      };
    } else {
      // Lower than marginReach
      const percent = Math.max(5, 40 + (diff / Math.abs(marginReach)) * 10);
      return {
        probability: parseFloat(percent.toFixed(0)),
        category: 'LOW',
        explanation: `Khả năng trúng tuyển THẤP. Điểm của bạn (${candidateScore}) thấp hơn nhiều so với điểm chuẩn năm ngoái (${lastYearBenchmark}).`,
      };
    }
  }

  async optimizePreferences(
    profile: CandidateProfile,
    preferences: Array<{
      programId: string;
      methodCode: string;
      order: number;
    }>,
  ): Promise<{ optimizedList: any[]; warnings: string[] }> {
    const list: any[] = [];
    const warnings: string[] = [];

    // Evaluate each preference in the list
    for (const pref of preferences) {
      const program = await this.programRepository.findOne({
        where: { id: pref.programId },
        relations: {
          university: true,
          campus: true,
          major: true,
          admissionRules: {
            admissionMethod: true,
            admissionScores: true,
          },
        },
      });

      if (!program) continue;

      // Find the rule corresponding to the selected methodCode
      const rule = program.admissionRules.find(
        (r) => r.admissionMethod.code === pref.methodCode,
      );
      if (!rule) continue;

      try {
        const evalResult = this.ruleEngineService.evaluate(profile, rule);
        const sortedScores = [...(rule.admissionScores || [])].sort(
          (a, b) => b.year - a.year,
        );
        const lastYearScoreRecord = sortedScores[0];
        const lastYearBenchmark = lastYearScoreRecord
          ? Number(lastYearScoreRecord.benchmarkScore)
          : 0;

        const { probability, category, explanation } =
          this.calculateProbability(
            evalResult.candidateScore,
            lastYearBenchmark,
            rule.minScoreThreshold,
            rule.admissionMethod?.code || '',
          );

        list.push({
          programId: program.id,
          programCode: program.code,
          programName: program.name,
          universityCode: program.university.code,
          universityName: program.university.nameVi,
          admissionMethod: rule.admissionMethod.name,
          admissionMethodCode: pref.methodCode,
          candidateScore: evalResult.candidateScore,
          benchmarkScoreLastYear: lastYearBenchmark,
          probability,
          probabilityCategory: category,
          explanation,
          currentOrder: pref.order,
        });
      } catch (err) {
        list.push({
          programId: program.id,
          programCode: program.code,
          programName: program.name,
          universityCode: program.university.code,
          universityName: program.university.nameVi,
          admissionMethod: rule.admissionMethod.name,
          admissionMethodCode: pref.methodCode,
          candidateScore: 0,
          benchmarkScoreLastYear: 0,
          probability: 0,
          probabilityCategory: 'LOW',
          explanation: 'Không thể tính toán điểm cho tổ hợp này.',
          currentOrder: pref.order,
        });
      }
    }

    const sortedByCurrentOrder = [...list].sort(
      (a, b) => a.currentOrder - b.currentOrder,
    );

    // Rule analysis for warnings
    for (let i = 0; i < sortedByCurrentOrder.length - 1; i++) {
      const current = sortedByCurrentOrder[i];
      const next = sortedByCurrentOrder[i + 1];

      if (
        current.probabilityCategory === 'SAFE' &&
        (next.probabilityCategory === 'MATCH' ||
          next.probabilityCategory === 'REACH')
      ) {
        warnings.push(
          `Nguyện vọng số ${current.currentOrder} (${current.programCode}) có tỷ lệ đậu Rất Cao (SAFE) nằm trên nguyện vọng số ${next.currentOrder} (${next.programCode}) có tỷ lệ đậu thấp hơn (${next.probabilityCategory === 'MATCH' ? 'Thích hợp' : 'Thử thách'}). Nếu đỗ NV ${current.currentOrder}, NV ${next.currentOrder} sẽ bị hủy.`,
        );
      }
    }

    const hasSafeOrMatch = list.some(
      (item) =>
        item.probabilityCategory === 'SAFE' ||
        item.probabilityCategory === 'MATCH',
    );
    if (list.length > 0 && !hasSafeOrMatch) {
      warnings.push(
        'Cảnh báo: Danh sách chưa có nguyện vọng AN TOÀN (SAFE) hoặc THÍCH HỢP (MATCH). Hãy thêm ít nhất một phương án dự phòng.',
      );
    }

    // Suggested optimized list
    const optimizedList = [...list]
      .sort((a, b) => {
        const weights: any = { REACH: 1, MATCH: 2, SAFE: 3, LOW: 4 };
        const aWeight = weights[a.probabilityCategory] || 5;
        const bWeight = weights[b.probabilityCategory] || 5;
        return aWeight - bWeight;
      })
      .map((item, idx) => ({
        ...item,
        suggestedOrder: idx + 1,
      }));

    return {
      optimizedList,
      warnings,
    };
  }
}
