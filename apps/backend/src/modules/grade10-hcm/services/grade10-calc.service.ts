import * as fs from 'fs';
import * as path from 'path';
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
    private readonly historyRepo: Repository<Grade10History>,
  ) {}

  
  private getMacroConfigPath() {
    return path.join(__dirname, '../macro-config.json');
  }

  getMacroConfig() {
    const p = this.getMacroConfigPath();
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        const examineesChange = (data.totalExamineesCurr - data.totalExamineesPrev) / data.totalExamineesPrev;
        const quotasChange = (data.totalQuotasCurr - data.totalQuotasPrev) / data.totalQuotasPrev;
        const diffShift = data.examDifficulty === 'easy' ? 0.75 : data.examDifficulty === 'hard' ? -0.75 : 0;
        const ssf = (examineesChange * 15 - quotasChange * 20) + diffShift;
        return {
          ...data,
          ssf: parseFloat(ssf.toFixed(2)),
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      totalExamineesPrev: 98500,
      totalExamineesCurr: 102000,
      totalQuotasPrev: 71000,
      totalQuotasCurr: 71500,
      examDifficulty: 'medium',
      ssf: 0.39,
    };
  }

  updateMacroConfig(data: any) {
    const p = this.getMacroConfigPath();
    const current = this.getMacroConfig();
    const updated = {
      totalExamineesPrev: Number(data.totalExamineesPrev ?? current.totalExamineesPrev),
      totalExamineesCurr: Number(data.totalExamineesCurr ?? current.totalExamineesCurr),
      totalQuotasPrev: Number(data.totalQuotasPrev ?? current.totalQuotasPrev),
      totalQuotasCurr: Number(data.totalQuotasCurr ?? current.totalQuotasCurr),
      examDifficulty: data.examDifficulty || current.examDifficulty,
    };
    fs.writeFileSync(p, JSON.stringify(updated, null, 2), 'utf8');
    return this.getMacroConfig();
  }

  calculateScore(dto: CalculateScoreDto): number {
    return (
      Number(dto.math) +
      Number(dto.literature) +
      Number(dto.english) +
      Number(dto.priority || 0) +
      Number(dto.bonus || 0)
    );
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
    this.historyRepo
      .save(
        this.historyRepo.create({
          mathScore: dto.math,
          literatureScore: dto.literature,
          englishScore: dto.english,
          priorityScore: dto.priority || 0,
          bonusScore: dto.bonus || 0,
          totalScore,
          preferredDistrict: dto.preferredDistrict || undefined,
        }),
      )
      .catch((err) => console.error('Failed to save search history', err));

    // 2. Fetch latest year cutoff scores
    const latestYearObj = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();

    const latestYear = latestYearObj?.maxYear || 2025;

    // Fetch all regular cutoffs for latest year
    const query = this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' });

    if (dto.preferredDistrict) {
      query.andWhere('school.districtId = :distId', {
        distId: dto.preferredDistrict,
      });
    }

    const cutoffs = await query.getMany();

    // 3. For each school, fetch last 3 years of scores to compute trend and stability
    const schoolIds = cutoffs.map((c) => c.schoolId);
    let historicalScores: Grade10Cutoff[] = [];
    if (schoolIds.length > 0) {
      historicalScores = await this.cutoffRepo
        .createQueryBuilder('cutoff')
        .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
        .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
        .andWhere('cutoff.year >= :year', { year: latestYear - 3 })
        .orderBy('cutoff.year', 'DESC')
        .getMany();
    }

    const config = this.getMacroConfig();
    const ssf = config.ssf || 0;
    const shiftedScore = totalScore - ssf;

    // 4. Run probability calculation and categorization
    const results = cutoffs.map((c) => {
      const schoolHist = historicalScores.filter(
        (h) => h.schoolId === c.schoolId,
      );
      const cutoffVal = Number(c.cutoffNV1);

      // Historical average
      const historicalNV1s = schoolHist.map((h) => Number(h.cutoffNV1));
      const avgNV1 =
        historicalNV1s.length > 0
          ? historicalNV1s.reduce((sum, val) => sum + val, 0) /
            historicalNV1s.length
          : cutoffVal;

      // 4 Diffs (with SSF shift)
      const d1 = shiftedScore - cutoffVal;
      const d2 = shiftedScore - avgNV1;
      const d3 = c.cutoffNV2 ? (shiftedScore - Number(c.cutoffNV2)) : (d1 - 1.0);
      const d4 = c.cutoffNV3 ? (shiftedScore - Number(c.cutoffNV3)) : (d1 - 2.0);

      // NV Gaps
      const nv2Gap = c.cutoffNV2 ? (Number(c.cutoffNV2) - cutoffVal) : null;
      const nv3Gap = c.cutoffNV3 ? (Number(c.cutoffNV3) - cutoffVal) : null;

      // Combined Safety Category
      let safetyCategory:
        'VERY_SAFE' | 'SAFE' | 'COMPETITIVE' | 'RISKY' | 'VERY_RISKY' =
        'VERY_RISKY';
      if (d1 >= 2.0 && d2 >= 2.0 && d3 >= 1.0 && d4 >= 0.5) safetyCategory = 'VERY_SAFE';
      else if (d1 >= 0.8 && d2 >= 0.8 && d3 >= 0.0) safetyCategory = 'SAFE';
      else if (d1 >= -0.7 && d2 >= -0.7) safetyCategory = 'COMPETITIVE';
      else if (d1 >= -1.8 && d2 >= -1.8) safetyCategory = 'RISKY';

      // Trend: UP, DOWN, STABLE
      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (schoolHist.length >= 2) {
        const diffTrend =
          Number(schoolHist[0].cutoffNV1) -
          Number(schoolHist[schoolHist.length - 1].cutoffNV1);
        if (diffTrend > 0.5) trend = 'UP';
        else if (diffTrend < -0.5) trend = 'DOWN';
      }

      // Strict Probability Formula
      const weightedDiff = d1 * 0.4 + d2 * 0.3 + d3 * 0.2 + d4 * 0.1;
      let probability = 50;
      if (weightedDiff < 0) {
        probability = Math.max(1, Math.round(50 * Math.exp(1.0 * weightedDiff)));
      } else {
        probability = Math.min(95, Math.round(50 + 38 * (1 - Math.exp(-0.5 * weightedDiff))));
      }

      let advice = '';
      if (safetyCategory === 'VERY_SAFE') {
        advice = 'Điểm của bạn vượt trội hoàn toàn cả 3 nguyện vọng. Cực kỳ an toàn.';
      } else if (safetyCategory === 'SAFE') {
        advice = trend === 'UP' 
          ? 'An toàn nhưng điểm trường đang có xu hướng tăng nhẹ. Phù hợp đặt làm NV1 hoặc NV2.' 
          : 'Lựa chọn an toàn cho cả NV1 lẫn NV2. Rất phù hợp để nộp hồ sơ.';
      } else if (safetyCategory === 'COMPETITIVE') {
        advice = trend === 'DOWN'
          ? 'Điểm bám sát điểm chuẩn và trường có xu hướng giảm nhẹ. Rất tốt để làm NV1.'
          : 'Mức độ cạnh tranh cao. Đây là một NV1 lý tưởng, hãy chuẩn bị thêm NV2 an toàn hơn.';
      } else if (safetyCategory === 'RISKY') {
        advice = 'Điểm của bạn đang tiệm cận rìa điểm chuẩn. Thích hợp làm NV1 thử thách nếu quyết tâm ôn tập.';
      } else {
        advice = 'Xác suất đỗ khá thấp ở mọi nguyện vọng. Nên hạ chỉ tiêu xuống trường an toàn hơn làm NV2/3.';
      }

      return {
        schoolId: c.school.id,
        schoolName: c.school.name,
        schoolCode: c.school.code,
        districtName: c.school.district?.name || 'N/A',
        cutoffNV1: cutoffVal,
        cutoffNV2: c.cutoffNV2 ? Number(c.cutoffNV2) : null,
        cutoffNV3: c.cutoffNV3 ? Number(c.cutoffNV3) : null,
        diff: Number(d1.toFixed(2)),
        d1: Number(d1.toFixed(2)),
        d2: Number(d2.toFixed(2)),
        d3: Number(d3.toFixed(2)),
        d4: Number(d4.toFixed(2)),
        nv2Gap: nv2Gap ? Number(nv2Gap.toFixed(2)) : null,
        nv3Gap: nv3Gap ? Number(nv3Gap.toFixed(2)) : null,
        safetyCategory,
        trend,
        advice,
        probability: Math.round(probability),
        historicalAvg: Number(avgNV1.toFixed(2)),
        last3YearsScores: schoolHist.map((h) => ({
          year: h.year,
          score: Number(h.cutoffNV1),
        })),
      };
    });

    // Advanced Sorting Strategy:
    // 1. Prioritize "Reachable" schools where diff >= -1.5
    // 2. Within the same group, sort by cutoffNV1 DESCENDING (prestigious schools first)
    results.sort((a, b) => {
      const aIsReachable = a.diff >= -1.5;
      const bIsReachable = b.diff >= -1.5;

      if (aIsReachable && !bIsReachable) return -1;
      if (!aIsReachable && bIsReachable) return 1;

      // Both in same group, sort by cutoffNV1 DESCENDING
      return b.cutoffNV1 - a.cutoffNV1;
    });

    return {
      candidateScore: totalScore,
      shiftedScore,
      ssf,
      macroConfig: config,
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

  async getComboRecommendations(dto: any) {
    const minScore = Number(dto.minMath) + Number(dto.minLiterature) + Number(dto.minEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const maxScore = Number(dto.maxMath) + Number(dto.maxLiterature) + Number(dto.maxEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const avgScore = (minScore + maxScore) / 2;

    const config = this.getMacroConfig();
    const ssf = config.ssf || 0;

    // 1. Fetch latest year
    const latestYearObj = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();
    const latestYear = latestYearObj?.maxYear || 2025;

    // 2. Fetch all schools and their latest year cutoffs
    const cutoffs = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .getMany();

    // 3. Fetch last 3 years of scores for all schools to compute average
    const schoolIds = cutoffs.map((c) => c.schoolId);
    let historicalScores: Grade10Cutoff[] = [];
    if (schoolIds.length > 0) {
      historicalScores = await this.cutoffRepo
        .createQueryBuilder('cutoff')
        .where('cutoff.schoolId IN (:...schoolIds)', { schoolIds })
        .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
        .andWhere('cutoff.year >= :year', { year: latestYear - 3 })
        .orderBy('cutoff.year', 'DESC')
        .getMany();
    }

    // Helper for Haversine distance
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const getStrictProb = (wDiff: number) => {
      if (wDiff < 0) {
        return Math.max(1, Math.round(50 * Math.exp(1.0 * wDiff)));
      } else {
        return Math.min(95, Math.round(50 + 38 * (1 - Math.exp(-0.5 * wDiff))));
      }
    };

    // 4. Commute filter and auto relax if too tight
    let rawMaxDist = Number(dto.maxCommuteDistance) || 12;
    let filteredCutoffs = cutoffs;
    let adjusted = false;

    if (dto.userLat && dto.userLon) {
      // Keep relaxing distance until we have at least 12 candidate schools or reach 80km
      while (rawMaxDist < 80) {
        const temp = cutoffs.filter(c => {
          if (!c.school.latitude || !c.school.longitude) return false;
          const d = getDistance(dto.userLat, dto.userLon, c.school.latitude, c.school.longitude);
          return d <= rawMaxDist;
        });

        if (temp.length >= 12) {
          filteredCutoffs = temp;
          break;
        }
        rawMaxDist = rawMaxDist * 1.5;
        adjusted = true;
      }
    }

    // 5. Calculate stats for each filtered school
    const candidates = filteredCutoffs.map((c) => {
      const schoolHist = historicalScores.filter((h) => h.schoolId === c.schoolId);
      const cutoffVal = Number(c.cutoffNV1);

      // Historical average
      const historicalNV1s = schoolHist.map((h) => Number(h.cutoffNV1));
      const avgNV1 =
        historicalNV1s.length > 0
          ? historicalNV1s.reduce((sum, val) => sum + val, 0) / historicalNV1s.length
          : cutoffVal;

      // Distance (if user coords provided)
      let distance = null;
      let commuteBonus = 0;
      if (dto.userLat && dto.userLon && c.school.latitude && c.school.longitude) {
        distance = getDistance(dto.userLat, dto.userLon, c.school.latitude, c.school.longitude);
        
        // Compute distance bonus points (cộng điểm di chuyển ảo)
        const ratio = distance / rawMaxDist;
        if (ratio < 1/3) {
          commuteBonus = 1.5;
        } else if (ratio <= 2/3) {
          commuteBonus = 0.75;
        }
      }

      // NV Gaps
      const nv2Gap = c.cutoffNV2 ? (Number(c.cutoffNV2) - cutoffVal) : 1.0;
      const nv3Gap = c.cutoffNV3 ? (Number(c.cutoffNV3) - cutoffVal) : 2.0;

      // 4 Diffs (calculated using avgScore - ssf + commuteBonus)
      const adjustedAvgScore = avgScore - ssf + commuteBonus;
      const d1 = adjustedAvgScore - cutoffVal;
      const d2 = adjustedAvgScore - avgNV1;
      const d3 = c.cutoffNV2 ? (adjustedAvgScore - Number(c.cutoffNV2)) : (d1 - nv2Gap);
      const d4 = c.cutoffNV3 ? (adjustedAvgScore - Number(c.cutoffNV3)) : (d1 - nv3Gap);

      // Weighted Diffs by NV
      const wDiffNV1 = d1 * 0.6 + d2 * 0.4;
      const wDiffNV2 = d3 * 0.6 + (d2 - nv2Gap) * 0.4;
      const wDiffNV3 = d4 * 0.6 + (d2 - nv3Gap) * 0.4;

      // Probabilities
      const probNV1 = getStrictProb(wDiffNV1);
      const probNV2 = getStrictProb(wDiffNV2);
      const probNV3 = getStrictProb(wDiffNV3);

      return {
        schoolId: c.school.id,
        schoolName: c.school.name,
        schoolCode: c.school.code,
        schoolType: c.school.schoolType,
        districtName: c.school.district?.name || 'N/A',
        latitude: c.school.latitude,
        longitude: c.school.longitude,
        cutoffNV1: cutoffVal,
        cutoffNV2: c.cutoffNV2 ? Number(c.cutoffNV2) : null,
        cutoffNV3: c.cutoffNV3 ? Number(c.cutoffNV3) : null,
        d1, d2, d3, d4,
        probNV1, probNV2, probNV3,
        distance: distance ? parseFloat(distance.toFixed(2)) : null,
        commuteBonus,
        nv2Gap,
        nv3Gap,
      };
    });

    // 6. Select Combo helper
    const findBestSchool = (
      pool: typeof candidates,
      targetProb: number,
      nvType: 'probNV1' | 'probNV2' | 'probNV3',
      excludeIds: string[]
    ) => {
      let filtered = pool.filter(s => !excludeIds.includes(s.schoolId));
      
      // Sort by closeness to target probability, and then by distance
      filtered.sort((a, b) => {
        const diffA = Math.abs(a[nvType] - targetProb);
        const diffB = Math.abs(b[nvType] - targetProb);
        if (Math.abs(diffA - diffB) < 5 && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance; 
        }
        return diffA - diffB;
      });

      return filtered[0] || null;
    };

    // 7. Build combos
    const combos: any = {};

    // Combo 1: An toàn (Safe)
    const safeNV1 = findBestSchool(candidates, 68, 'probNV1', []);
    const safeNV2 = findBestSchool(candidates, 80, 'probNV2', safeNV1 ? [safeNV1.schoolId] : []);
    const safeNV3 = findBestSchool(candidates, 92, 'probNV3', [
      ...(safeNV1 ? [safeNV1.schoolId] : []),
      ...(safeNV2 ? [safeNV2.schoolId] : []),
    ]);
    combos.safe = [safeNV1, safeNV2, safeNV3].filter(Boolean);

    // Combo 2: Nỗ lực (Challenge)
    let dreamSchool = candidates.find(s => s.schoolCode === dto.dreamSchoolCode);
    if (!dreamSchool && candidates.length > 0) {
      dreamSchool = findBestSchool(candidates, 50, 'probNV1', []);
    }
    
    const effortNV2 = findBestSchool(candidates, 70, 'probNV2', dreamSchool ? [dreamSchool.schoolId] : []);
    const effortNV3 = findBestSchool(candidates, 88, 'probNV3', [
      ...(dreamSchool ? [dreamSchool.schoolId] : []),
      ...(effortNV2 ? [effortNV2.schoolId] : []),
    ]);
    combos.effort = [dreamSchool, effortNV2, effortNV3].filter(Boolean);

    // Combo 3: Phòng thủ (Defensive)
    const defNV1 = findBestSchool(candidates, 80, 'probNV1', []);
    const defNV2 = findBestSchool(candidates, 88, 'probNV2', defNV1 ? [defNV1.schoolId] : []);
    const defNV3 = findBestSchool(candidates, 94, 'probNV3', [
      ...(defNV1 ? [defNV1.schoolId] : []),
      ...(defNV2 ? [defNV2.schoolId] : []),
    ]);
    combos.defense = [defNV1, defNV2, defNV3].filter(Boolean);

    // 8. Generate explanations
    const explanations: any = {};
    
    const getSchoolDesc = (s: any, nv: number) => {
      if (!s) return '';
      const prob = nv === 1 ? s.probNV1 : nv === 2 ? s.probNV2 : s.probNV3;
      const distStr = s.distance !== null ? ' (cách nhà ' + s.distance + 'km)' : '';
      const bonusStr = s.commuteBonus > 0 ? ' (được cộng ưu tiên ' + s.commuteBonus + 'đ di chuyển)' : '';
      return 'NV' + nv + ' [' + s.schoolName + '] (Xác suất đỗ: ' + prob + '%' + distStr + bonusStr + ')';
    };

    if (combos.safe.length === 3) {
      explanations.safe = 'Chiến lược An toàn đề xuất combo phân bổ điểm chuẩn giảm dần hợp lý giúp bạn tối ưu cơ hội học công lập gần nhà. ' +
        'Bao gồm: ' + getSchoolDesc(combos.safe[0], 1) + ', ' + getSchoolDesc(combos.safe[1], 2) + ', và chốt chặn cuối cùng là ' + getSchoolDesc(combos.safe[2], 3) + '. ' +
        'Tất cả các nguyện vọng này được xếp xen kẽ dựa trên khoảng cách địa lý và điểm chuẩn lịch sử để giảm thiểu rủi ro điểm chuẩn biến động đột ngột.';
    } else {
      explanations.safe = 'Không tìm đủ trường gần nhà để ghép combo an toàn hoàn chỉnh. Hãy nới rộng khoảng cách giới hạn đi học.';
    }

    if (combos.effort.length === 3) {
      explanations.effort = 'Chiến lược Nỗ lực được thiết kế để bạn dốc sức theo đuổi đam mê. ' +
        'NV1 đặt vào trường mơ ước của bạn là ' + getSchoolDesc(combos.effort[0], 1) + '. ' +
        'Nếu NV1 trượt do điểm chuẩn biến động tăng cao, bạn vẫn hoàn toàn yên tâm vì phía sau đã có các chốt chặn chất lượng: ' +
        'NV2 là ' + getSchoolDesc(combos.effort[1], 2) + ' và bệ đỡ phòng thủ vững vàng tại NV3 là ' + getSchoolDesc(combos.effort[2], 3) + '.';
    } else {
      explanations.effort = 'Không tìm đủ trường gần nhà để ghép combo nỗ lực hoàn chỉnh. Hãy nới rộng khoảng cách giới hạn đi học.';
    }

    if (combos.defense.length === 3) {
      explanations.defense = 'Chiến lược Phòng thủ ưu tiên tính an tâm tuyệt đối, hạn chế tối đa rủi ro trượt công lập. ' +
        'Ngay tại NV1, hệ thống đã xếp bạn vào trường cực kỳ chắc cú: ' + getSchoolDesc(combos.defense[0], 1) + '. ' +
        'Tiếp theo là chốt chặn NV2 ' + getSchoolDesc(combos.defense[1], 2) + ' và NV3 ' + getSchoolDesc(combos.defense[2], 3) + ' ' +
        'với xác suất đỗ cao gần như tuyệt đối để đảm bảo bạn luôn có một suất học THPT Công lập thuận tiện đi lại nhất.';
    } else {
      explanations.defense = 'Không tìm đủ trường gần nhà để ghép combo phòng thủ hoàn chỉnh. Hãy nới rộng khoảng cách giới hạn đi học.';
    }

    return {
      minScore,
      maxScore,
      avgScore,
      combos,
      explanations,
      ssf,
      macroConfig: config,
      maxCommuteDistance: parseFloat(rawMaxDist.toFixed(1)),
      adjusted,
    };
  }

}