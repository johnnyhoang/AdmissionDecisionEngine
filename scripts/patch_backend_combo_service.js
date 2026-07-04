const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-calc.service.ts');
let content = fs.readFileSync(servicePath, 'utf8');

const serviceMethod = `
  async getComboRecommendations(dto: any) {
    const minScore = Number(dto.minMath) + Number(dto.minLiterature) + Number(dto.minEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const maxScore = Number(dto.maxMath) + Number(dto.maxLiterature) + Number(dto.maxEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const avgScore = (minScore + maxScore) / 2;

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

    // 4. Calculate stats for each school
    const candidates = cutoffs.map((c) => {
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
      if (dto.userLat && dto.userLon && c.school.latitude && c.school.longitude) {
        distance = getDistance(dto.userLat, dto.userLon, c.school.latitude, c.school.longitude);
      }

      // NV Gaps
      const nv2Gap = c.cutoffNV2 ? (Number(c.cutoffNV2) - cutoffVal) : 1.0;
      const nv3Gap = c.cutoffNV3 ? (Number(c.cutoffNV3) - cutoffVal) : 2.0;

      // 4 Diffs (calculated using avgScore)
      const d1 = avgScore - cutoffVal;
      const d2 = avgScore - avgNV1;
      const d3 = c.cutoffNV2 ? (avgScore - Number(c.cutoffNV2)) : (d1 - nv2Gap);
      const d4 = c.cutoffNV3 ? (avgScore - Number(c.cutoffNV3)) : (d1 - nv3Gap);

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
        nv2Gap,
        nv3Gap,
      };
    });

    // 5. Select Combo helper
    // Find school closest to target probability and sort by distance if available
    const findBestSchool = (
      pool: typeof candidates,
      targetProb: number,
      nvType: 'probNV1' | 'probNV2' | 'probNV3',
      excludeIds: string[]
    ) => {
      let filtered = pool.filter(s => !excludeIds.includes(s.schoolId));
      
      // If coordinates are provided, prioritize schools within 15km
      if (dto.userLat && dto.userLon) {
        const localPool = filtered.filter(s => s.distance !== null && s.distance <= 15);
        if (localPool.length > 0) {
          filtered = localPool;
        }
      }

      // Sort by closeness to target probability, and then by distance
      filtered.sort((a, b) => {
        const diffA = Math.abs(a[nvType] - targetProb);
        const diffB = Math.abs(b[nvType] - targetProb);
        if (Math.abs(diffA - diffB) < 5 && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance; // Prefer closer school if probabilities are close
        }
        return diffA - diffB;
      });

      return filtered[0] || null;
    };

    // 6. Build combos
    const combos: any = {};

    // Combo 1: An toàn (Safe)
    // NV1: Target NV1 prob ~ 68%
    // NV2: Target NV2 prob ~ 80%
    // NV3: Target NV3 prob ~ 92%
    const safeNV1 = findBestSchool(candidates, 68, 'probNV1', []);
    const safeNV2 = findBestSchool(candidates, 80, 'probNV2', safeNV1 ? [safeNV1.schoolId] : []);
    const safeNV3 = findBestSchool(candidates, 92, 'probNV3', [
      ...(safeNV1 ? [safeNV1.schoolId] : []),
      ...(safeNV2 ? [safeNV2.schoolId] : []),
    ]);
    combos.safe = [safeNV1, safeNV2, safeNV3].filter(Boolean);

    // Combo 2: Nỗ lực (Challenge)
    // NV1: Dream School
    // NV2: Target NV2 prob ~ 70%
    // NV3: Target NV3 prob ~ 88%
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
    // NV1: Target NV1 prob ~ 80%
    // NV2: Target NV2 prob ~ 88%
    // NV3: Target NV3 prob ~ 94%
    const defNV1 = findBestSchool(candidates, 80, 'probNV1', []);
    const defNV2 = findBestSchool(candidates, 88, 'probNV2', defNV1 ? [defNV1.schoolId] : []);
    const defNV3 = findBestSchool(candidates, 94, 'probNV3', [
      ...(defNV1 ? [defNV1.schoolId] : []),
      ...(defNV2 ? [defNV2.schoolId] : []),
    ]);
    combos.defense = [defNV1, defNV2, defNV3].filter(Boolean);

    return {
      minScore,
      maxScore,
      avgScore,
      combos,
    };
  }
`;

content = content.replace(/}\s*$/, serviceMethod + '\n}');
fs.writeFileSync(servicePath, content, 'utf8');
console.log('Backend Service updated with getComboRecommendations');
