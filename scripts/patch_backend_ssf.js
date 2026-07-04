const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-calc.service.ts');
let content = fs.readFileSync(servicePath, 'utf8');

// 1. Add imports at the top if not present
if (!content.includes("import * as fs")) {
  content = "import * as fs from 'fs';\nimport * as path from 'path';\n" + content;
}

// 2. Add macro config helper methods inside the class
const macroConfigMethods = `
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
`;

// Insert the macro config methods right after constructor closing bracket or calculateScore
content = content.replace("calculateScore(dto: CalculateScoreDto): number {", macroConfigMethods + "\n  calculateScore(dto: CalculateScoreDto): number {");

// 3. Update getRecommendations to use ssf
const oldGetRecStart = `    // 4. Run probability calculation and categorization
    const results = cutoffs.map((c) => {`;

const newGetRecStart = `    const config = this.getMacroConfig();
    const ssf = config.ssf || 0;
    const shiftedScore = totalScore - ssf;

    // 4. Run probability calculation and categorization
    const results = cutoffs.map((c) => {`;

content = content.replace(oldGetRecStart, newGetRecStart);

// Inside the mapping of getRecommendations, change totalScore to shiftedScore
content = content.replace(
  `      // 4 Diffs
      const d1 = totalScore - cutoffVal;
      const d2 = totalScore - avgNV1;
      const d3 = c.cutoffNV2 ? (totalScore - Number(c.cutoffNV2)) : (d1 - 1.0);
      const d4 = c.cutoffNV3 ? (totalScore - Number(c.cutoffNV3)) : (d1 - 2.0);`,
  `      // 4 Diffs (with SSF shift)
      const d1 = shiftedScore - cutoffVal;
      const d2 = shiftedScore - avgNV1;
      const d3 = c.cutoffNV2 ? (shiftedScore - Number(c.cutoffNV2)) : (d1 - 1.0);
      const d4 = c.cutoffNV3 ? (shiftedScore - Number(c.cutoffNV3)) : (d1 - 2.0);`
);

// Update return statement of getRecommendations
content = content.replace(
  `    return {
      candidateScore: totalScore,
      details: {`,
  `    return {
      candidateScore: totalScore,
      shiftedScore,
      ssf,
      macroConfig: config,
      details: {`
);

// 4. Update getComboRecommendations to use ssf
const oldComboRecStart = `    const minScore = Number(dto.minMath) + Number(dto.minLiterature) + Number(dto.minEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const maxScore = Number(dto.maxMath) + Number(dto.maxLiterature) + Number(dto.maxEnglish) + Number(dto.priority || 0) + Number(dto.bonus || 0);
    const avgScore = (minScore + maxScore) / 2;`;

const newComboRecStart = oldComboRecStart + `\n
    const config = this.getMacroConfig();
    const ssf = config.ssf || 0;`;

content = content.replace(oldComboRecStart, newComboRecStart);

// In getComboRecommendations: update candidates calculations to subtract ssf from avgScore
content = content.replace(
      `      // 4 Diffs (calculated using avgScore + commuteBonus)
      const adjustedAvgScore = avgScore + commuteBonus;`,
      `      // 4 Diffs (calculated using avgScore - ssf + commuteBonus)
      const adjustedAvgScore = avgScore - ssf + commuteBonus;`
);

// Update getComboRecommendations return statement to include ssf
content = content.replace(
  `    return {
      minScore,
      maxScore,
      avgScore,
      combos,
      explanations,`,
  `    return {
      minScore,
      maxScore,
      avgScore,
      combos,
      explanations,
      ssf,
      macroConfig: config,`
);

fs.writeFileSync(servicePath, content, 'utf8');
console.log('Backend service successfully patched with SSF and Macro configs');
