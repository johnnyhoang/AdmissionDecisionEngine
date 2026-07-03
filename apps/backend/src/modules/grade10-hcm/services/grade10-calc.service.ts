import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { Grade10History } from '../entities/history.entity';
import { CalculateScoreDto } from '../dtos/calculate.dto';
import { GetRecommendationDto } from '../dtos/recommendation.dto';

@Injectable()
export class Grade10CalcService {
  constructor(
    @InjectRepository(Grade10School)
    private readonly schoolRepo: Repository<Grade10School>,
    @InjectRepository(Grade10Cutoff)
    private readonly cutoffRepo: Repository<Grade10Cutoff>,
    @InjectRepository(Grade10History)
    private readonly historyRepo: Repository<Grade10History>
  ) {}

  calculateScore(dto: CalculateScoreDto): number {
    return Number(dto.math) + Number(dto.literature) + Number(dto.english) + Number(dto.priority || 0) + Number(dto.bonus || 0);
  }

  async getRecommendations(dto: GetRecommendationDto) {
    const totalScore = this.calculateScore({
      math: dto.math,
      literature: dto.literature,
      english: dto.english,
      priority: dto.priority,
      bonus: dto.bonus,
    });

    // 1. Save history record (fire-and-forget/async background save)
    this.historyRepo.save(this.historyRepo.create({
      mathScore: dto.math,
      literatureScore: dto.literature,
      englishScore: dto.english,
      priorityScore: dto.priority || 0,
      bonusScore: dto.bonus || 0,
      totalScore,
      preferredDistrict: dto.preferredDistrict || undefined,
    })).catch(err => console.error('Failed to save search history', err));

    // 2. Fetch latest year cutoff scores
    const latestYearObj = await this.cutoffRepo.createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();
    
    const latestYear = latestYearObj?.maxYear || 2025;

    // Fetch all regular cutoffs for latest year
    const query = this.cutoffRepo.createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' });

    if (dto.preferredDistrict) {
      query.andWhere('school.districtId = :distId', { distId: dto.preferredDistrict });
    }

    const cutoffs = await query.getMany();

    // 3. For each school, fetch last 3 years of scores to compute trend and stability
    const schoolIds = cutoffs.map(c => c.schoolId);
    let historicalScores: Grade10Cutoff[] = [];
    if (schoolIds.length > 0) {
      historicalScores = await this.cutoffRepo.createQueryBuilder('cutoff')
        .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
        .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
        .andWhere('cutoff.year >= :year', { year: latestYear - 3 })
        .orderBy('cutoff.year', 'DESC')
        .getMany();
    }

    // 4. Run probability calculation and categorization
    const results = cutoffs.map(c => {
      const schoolHist = historicalScores.filter(h => h.schoolId === c.schoolId);
      const cutoffVal = Number(c.cutoffNV1);
      const diff = totalScore - cutoffVal;

      // Safety categories
      let safetyCategory: 'VERY_SAFE' | 'SAFE' | 'COMPETITIVE' | 'RISKY' | 'VERY_RISKY' = 'VERY_RISKY';
      if (diff >= 2.5) safetyCategory = 'VERY_SAFE';
      else if (diff >= 1.0) safetyCategory = 'SAFE';
      else if (diff >= -1.0) safetyCategory = 'COMPETITIVE';
      else if (diff >= -2.0) safetyCategory = 'RISKY';

      // Historical average and variance
      const historicalNV1s = schoolHist.map(h => Number(h.cutoffNV1));
      const avgNV1 = historicalNV1s.length > 0 
        ? historicalNV1s.reduce((sum, val) => sum + val, 0) / historicalNV1s.length 
        : cutoffVal;

      // Trend: UP, DOWN, STABLE
      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (schoolHist.length >= 2) {
        const diffTrend = Number(schoolHist[0].cutoffNV1) - Number(schoolHist[schoolHist.length - 1].cutoffNV1);
        if (diffTrend > 0.5) trend = 'UP';
        else if (diffTrend < -0.5) trend = 'DOWN';
      }

      // Probability percentage estimate
      // Z-score calculation: Z = (S - Avg) / StdDev. Assume default stddev of 1.2
      const deltaMean = totalScore - avgNV1;
      const stdDev = 1.2;
      const z = deltaMean / stdDev;
      // Map Z-score to standard normal cumulative distribution approximation
      let probability = 50 + z * 25; // Simple linear approximation
      if (probability > 99) probability = 99;
      if (probability < 1) probability = 1;

      return {
        schoolId: c.school.id,
        schoolName: c.school.name,
        schoolCode: c.school.code,
        districtName: c.school.district?.name || 'N/A',
        cutoffNV1: cutoffVal,
        cutoffNV2: c.cutoffNV2 ? Number(c.cutoffNV2) : null,
        cutoffNV3: c.cutoffNV3 ? Number(c.cutoffNV3) : null,
        diff: Number(diff.toFixed(2)),
        safetyCategory,
        trend,
        probability: Math.round(probability),
        historicalAvg: Number(avgNV1.toFixed(2)),
        last3YearsScores: schoolHist.map(h => ({ year: h.year, score: Number(h.cutoffNV1) })),
      };
    });

    // Sort by difference desc (best matches first)
    results.sort((a, b) => b.diff - a.diff);

    return {
      candidateScore: totalScore,
      details: {
        math: dto.math,
        literature: dto.literature,
        english: dto.english,
        priority: dto.priority || 0,
        bonus: dto.bonus || 0,
      },
      recommendations: results,
    };
  }
}
