const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-school.service.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

const serviceMethod = `
  async mergeSchools(primaryId: string, secondaryId: string, mergedData: any) {
    const primary = await this.schoolRepo.findOneBy({ id: primaryId });
    const secondary = await this.schoolRepo.findOneBy({ id: secondaryId });
    if (!primary || !secondary) {
      throw new NotFoundException('One or both schools not found');
    }

    // Process cutoffs from mergedData
    if (mergedData.cutoffs && Array.isArray(mergedData.cutoffs)) {
      await this.cutoffRepo.delete({ schoolId: primaryId });
      await this.cutoffRepo.delete({ schoolId: secondaryId });
      
      const newCutoffs = mergedData.cutoffs.map(c => this.cutoffRepo.create({
        ...c,
        schoolId: primaryId
      }));
      await this.cutoffRepo.save(newCutoffs);
    }

    // Process quotas from mergedData
    if (mergedData.quotas && Array.isArray(mergedData.quotas)) {
      await this.quotaRepo.delete({ schoolId: primaryId });
      await this.quotaRepo.delete({ schoolId: secondaryId });
      
      const newQuotas = mergedData.quotas.map(q => this.quotaRepo.create({
        ...q,
        schoolId: primaryId
      }));
      await this.quotaRepo.save(newQuotas);
    }

    // Clean up basic merged data so we don't save arrays into school
    const basicData = { ...mergedData };
    delete basicData.cutoffs;
    delete basicData.quotas;

    // Update primary
    Object.assign(primary, basicData);
    await this.schoolRepo.save(primary);

    // Hard delete secondary (will cascade to its history if any)
    await this.schoolRepo.remove(secondary);

    return primary;
  }
`;

serviceContent = serviceContent.replace(/async mergeSchools[\s\S]*?return primary;\n  }/, serviceMethod.trim());
fs.writeFileSync(servicePath, serviceContent, 'utf8');

console.log('Backend patched with hard delete and cutoff/quota logic');
