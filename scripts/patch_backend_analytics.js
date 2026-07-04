const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-school.service.ts');
let content = fs.readFileSync(servicePath, 'utf8');

const newGetAnalytics = `
  async getAnalytics() {
    // 1. Top 10 schools by latest NV1 Cutoff
    const latestYearObj = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .select('MAX(cutoff.year)', 'maxYear')
      .getRawOne();

    const latestYear = latestYearObj?.maxYear || 2025;

    const topSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .orderBy('cutoff.cutoffNV1', 'DESC')
      .limit(10)
      .getMany();

    const topSchools = topSchoolsRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 2. Bottom 10 schools by latest NV1 Cutoff
    const bottomSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .andWhere('cutoff.cutoffNV1 > 0')
      .orderBy('cutoff.cutoffNV1', 'ASC')
      .limit(10)
      .getMany();

    const bottomSchools = bottomSchoolsRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // 3. Top Quota
    const topQuotaRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.quota', 'DESC')
      .limit(10)
      .getMany();

    const topQuota = topQuotaRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      quota: Number(q.quota),
      year: q.year,
    }));

    // 4. Top Ratio (Competition)
    const topRatioRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.competitionRatio', 'DESC')
      .limit(10)
      .getMany();

    const topRatio = topRatioRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      ratio: Number(q.competitionRatio),
      year: q.year,
    }));

    // 5. Bottom Ratio (Lowest competition)
    const bottomRatioRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .andWhere('quota.competitionRatio > 0')
      .orderBy('quota.competitionRatio', 'ASC')
      .limit(10)
      .getMany();

    const bottomRatio = bottomRatioRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      ratio: Number(q.competitionRatio),
      year: q.year,
    }));

    // 6. Top Increase (Difference latest vs previous year)
    const diffSchoolsRaw = await this.cutoffRepo
      .createQueryBuilder('c1')
      .innerJoin(Grade10Cutoff, 'c2', 'c1.schoolId = c2.schoolId AND c2.year = :prevYear AND c2.programType = :pt', { prevYear: latestYear - 1, pt: 'REGULAR' })
      .leftJoinAndSelect('c1.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .select('school.id', 'schoolId')
      .addSelect('school.name', 'schoolName')
      .addSelect('school.code', 'schoolCode')
      .addSelect('district.name', 'districtName')
      .addSelect('c1.cutoffNV1', 'cutoffNew')
      .addSelect('c2.cutoffNV1', 'cutoffOld')
      .addSelect('(c1.cutoffNV1 - c2.cutoffNV1)', 'diff')
      .where('c1.year = :year', { year: latestYear })
      .andWhere('c1.programType = :pt', { pt: 'REGULAR' })
      .orderBy('diff', 'DESC')
      .limit(10)
      .getRawMany();

    const topIncrease = diffSchoolsRaw.map((r) => ({
      schoolId: r.schoolId,
      schoolName: r.schoolName,
      schoolCode: r.schoolCode,
      districtName: r.districtName || 'N/A',
      cutoffNew: Number(r.cutoffNew),
      cutoffOld: Number(r.cutoffOld),
      diff: Number(Number(r.diff).toFixed(2)),
    }));

    // 7. Top Registered count
    const topRegisteredRaw = await this.quotaRepo
      .createQueryBuilder('quota')
      .leftJoinAndSelect('quota.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('quota.year = :year', { year: latestYear })
      .andWhere('quota.programType = :pt', { pt: 'REGULAR' })
      .orderBy('quota.registeredCount', 'DESC')
      .limit(10)
      .getMany();

    const topRegistered = topRegisteredRaw.map((q) => ({
      schoolId: q.school.id,
      schoolName: q.school.name,
      schoolCode: q.school.code,
      districtName: q.school.district?.name || 'N/A',
      registeredCount: Number(q.registeredCount),
      year: q.year,
    }));

    // 8. Top Specialized Schools
    const topSpecializedRaw = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoinAndSelect('cutoff.school', 'school')
      .leftJoinAndSelect('school.district', 'district')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('school.schoolType = :st', { st: 'SPECIALIZED' })
      .orderBy('cutoff.cutoffNV1', 'DESC')
      .limit(10)
      .getMany();

    const topSpecialized = topSpecializedRaw.map((c) => ({
      schoolId: c.school.id,
      schoolName: c.school.name,
      schoolCode: c.school.code,
      districtName: c.school.district?.name || 'N/A',
      cutoffNV1: Number(c.cutoffNV1),
      year: c.year,
    }));

    // Average NV1 Cutoff score by district
    const districtStats = await this.cutoffRepo
      .createQueryBuilder('cutoff')
      .leftJoin('cutoff.school', 'school')
      .leftJoin('school.district', 'district')
      .select('district.name', 'districtName')
      .addSelect('AVG(cutoff.cutoffNV1)', 'avgCutoff')
      .addSelect('COUNT(school.id)', 'schoolCount')
      .where('cutoff.year = :year', { year: latestYear })
      .andWhere('cutoff.programType = :pt', { pt: 'REGULAR' })
      .groupBy('district.name')
      .orderBy('avgCutoff', 'DESC')
      .getRawMany();

    const districtAverages = districtStats.map((d) => ({
      districtName: d.districtName || 'N/A',
      avgCutoff: Number(Number(d.avgCutoff).toFixed(2)),
      schoolCount: parseInt(d.schoolCount),
    }));

    // Quota and Registration trend over years
    const overallTrends = await this.quotaRepo
      .createQueryBuilder('quota')
      .select('quota.year', 'year')
      .addSelect('SUM(quota.quota)', 'totalQuota')
      .addSelect('SUM(quota.registeredCount)', 'totalRegistered')
      .where('quota.programType = :pt', { pt: 'REGULAR' })
      .groupBy('quota.year')
      .orderBy('quota.year', 'ASC')
      .getRawMany();

    const trends = overallTrends.map((t) => ({
      year: parseInt(t.year),
      totalQuota: parseInt(t.totalQuota || 0),
      totalRegistered: parseInt(t.totalRegistered || 0),
      avgCompetitionRatio:
        t.totalQuota > 0
          ? Number((t.totalRegistered / t.totalQuota).toFixed(2))
          : 0,
    }));

    return {
      latestYear,
      topSchools,
      bottomSchools,
      topQuota,
      topRatio,
      bottomRatio,
      topIncrease,
      topRegistered,
      topSpecialized,
      districtAverages,
      trends,
    };
  }
`;

content = content.replace(/async getAnalytics\(\) {[\s\S]*?\n  }/, newGetAnalytics.trim());
fs.writeFileSync(servicePath, content, 'utf8');
console.log('Backend Analytics method updated successfully');
