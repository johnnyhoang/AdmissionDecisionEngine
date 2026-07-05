import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';

export function cleanCoreSchoolName(name: string): { type: string; coreName: string; fullName: string } {
  let type = 'THPT'; // default
  let clean = name.trim();

  // Determine type
  if (/\b(THCS|Trung học Cơ sở|Cấp 2)\b/i.test(clean)) {
    type = 'THCS';
  } else if (/\b(THPT|PTTH|Trung học Phổ thông|Cấp 3)\b/i.test(clean)) {
    type = 'THPT';
  }

  // Remove prefixes
  clean = clean
    .replace(/^(Trường\s+)?(Trung\s*học\s*Phổ\s*thông|Trung\s*học\s*Cơ\s*sở|THPT|THCS|PTTH|Trường)\s+/gi, '')
    .trim();

  // Remove suffixes like (Q1), (Q.12), (TB), - Q1, - Q. Tân Bình, - TB, - Cơ sở 2, etc.
  clean = clean
    .replace(/\s*[\(\-–—]\s*(Q\d+|Q\.\s*\d+|Q\.\s*[a-zđăâêôơư]+\s*[a-zđăâêôơư]*|Quận\s*[a-zđăâêôơư\d]+|TB|cơ sở \d+|phân hiệu \d+)\s*[\)]?/gi, '')
    .replace(/\s+(Q\d+|Q\.\d+|Q\.\s*[a-zđăâêôơư]+|Quận\s+\d+|TB)$/gi, '')
    .replace(/\s*[\(\-–—]\s*([a-zđăâêôơư\d\s]+)\s*[\)]?$/gi, (match, p1) => {
      const normP1 = p1.toLowerCase().trim();
      if (normP1.length < 12 && (
        normP1.includes('quan') || 
        normP1.includes('huyen') || 
        /^[a-z0-9\s]+$/i.test(normP1) ||
        normP1 === 'tb' ||
        normP1.startsWith('q')
      )) {
        return '';
      }
      return match;
    })
    .trim();

  // Capitalize words
  const coreName = clean
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const fullName = `${type} ${coreName}`;
  return { type, coreName, fullName };
}

export async function deduplicateSchoolsHelper(
  schoolRepo: Repository<Grade10School>,
  quotaRepo: Repository<Grade10Quota>,
  cutoffRepo: Repository<Grade10Cutoff>
) {
  console.log('Running Grade 10 HCM School Deduplication & Merge...');
  try {
    const schools = await schoolRepo.find();
    
    // Group schools by normalized name
    const groups: Record<string, Grade10School[]> = {};
    for (const school of schools) {
      const { fullName } = cleanCoreSchoolName(school.name);
      if (!groups[fullName]) {
        groups[fullName] = [];
      }
      groups[fullName].push(school);
    }

    // Helper to merge cutoff scores (taking max of valid <= 30)
    const mergeScore = (s1: number | null, s2: number | null): number | null => {
      const v1 = s1 !== null && s1 !== undefined ? Number(s1) : null;
      const v2 = s2 !== null && s2 !== undefined ? Number(s2) : null;
      const isV1Valid = v1 !== null && v1 <= 30 && v1 > 0;
      const isV2Valid = v2 !== null && v2 <= 30 && v2 > 0;
      if (isV1Valid && isV2Valid) return Math.max(v1, v2);
      if (isV1Valid) return v1;
      if (isV2Valid) return v2;
      return null;
    };

    // Sanitize a single score
    const sanitizeScore = (s: number | null | undefined): number | null => {
      if (s === null || s === undefined) return null;
      const val = Number(s);
      if (val > 30 || val <= 0) return null;
      return val;
    };

    for (const fullName of Object.keys(groups)) {
      const group = groups[fullName];
      if (group.length <= 1) {
        // Even if there is only 1 school in the group, we want to normalize its name to the standard fullName format
        const school = group[0];
        if (school && school.name !== fullName) {
          console.log(`Normalizing name of school ${school.name} -> ${fullName}`);
          school.name = fullName;
          await schoolRepo.save(school);
        }
        continue;
      }

      // We have duplicates! Let's choose the keepSchool
      group.sort((a, b) => {
        if (a.name === fullName && b.name !== fullName) return -1;
        if (b.name === fullName && a.name !== fullName) return 1;
        return a.name.length - b.name.length;
      });

      const keepSchool = group[0];
      const duplicates = group.slice(1);

      console.log(`Merging duplicates for school ${keepSchool.name} (keeping ID: ${keepSchool.id})...`);
      
      // Update keepSchool's name to the normalized name
      if (keepSchool.name !== fullName) {
        keepSchool.name = fullName;
        await schoolRepo.save(keepSchool);
      }

      for (const dup of duplicates) {
        console.log(`- Merging duplicate school: ${dup.name} (ID: ${dup.id}) into ${keepSchool.name}...`);

        // 1. Merge Quotas
        const dupQuotas = await quotaRepo.find({ where: { schoolId: dup.id } });
        for (const qDup of dupQuotas) {
          const qKeep = await quotaRepo.findOne({
            where: { schoolId: keepSchool.id, year: qDup.year, programType: qDup.programType }
          });
          if (qKeep) {
            qKeep.quota = Math.max(qKeep.quota || 0, qDup.quota || 0);
            qKeep.registeredCount = Math.max(qKeep.registeredCount || 0, qDup.registeredCount || 0);
            if (qKeep.quota > 0) {
              qKeep.competitionRatio = Number((qKeep.registeredCount / qKeep.quota).toFixed(2));
            }
            await quotaRepo.save(qKeep);
            await quotaRepo.remove(qDup);
          } else {
            qDup.schoolId = keepSchool.id;
            await quotaRepo.save(qDup);
          }
        }

        // 2. Merge Cutoffs
        const dupCutoffs = await cutoffRepo.find({ where: { schoolId: dup.id } });
        for (const cDup of dupCutoffs) {
          const cKeep = await cutoffRepo.findOne({
            where: { schoolId: keepSchool.id, year: cDup.year, programType: cDup.programType }
          });
          if (cKeep) {
            cKeep.cutoffNV1 = mergeScore(cKeep.cutoffNV1, cDup.cutoffNV1) || sanitizeScore(cKeep.cutoffNV1) || sanitizeScore(cDup.cutoffNV1) || 0;
            cKeep.cutoffNV2 = mergeScore(cKeep.cutoffNV2, cDup.cutoffNV2);
            cKeep.cutoffNV3 = mergeScore(cKeep.cutoffNV3, cDup.cutoffNV3);
            cKeep.lowestScore = mergeScore(cKeep.lowestScore, cDup.lowestScore) || 0;
            cKeep.highestScore = mergeScore(cKeep.highestScore, cDup.highestScore) || 0;
            await cutoffRepo.save(cKeep);
            await cutoffRepo.remove(cDup);
          } else {
            cDup.schoolId = keepSchool.id;
            cDup.cutoffNV1 = sanitizeScore(cDup.cutoffNV1) || 0;
            cDup.cutoffNV2 = sanitizeScore(cDup.cutoffNV2);
            cDup.cutoffNV3 = sanitizeScore(cDup.cutoffNV3);
            cDup.lowestScore = sanitizeScore(cDup.lowestScore) || 0;
            cDup.highestScore = sanitizeScore(cDup.highestScore) || 0;
            await cutoffRepo.save(cDup);
          }
        }

        // 3. Delete duplicate school
        await schoolRepo.remove(dup);
      }
    }
    console.log('School deduplication and merge completed successfully!');
  } catch (e: any) {
    console.error('Error during school deduplication:', e);
  }
}
