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

    // Move quotas
    const secondaryQuotas = await this.quotaRepo.find({ where: { school: { id: secondaryId } } });
    for (const quota of secondaryQuotas) {
      const existing = await this.quotaRepo.findOne({ where: { school: { id: primaryId }, year: quota.year, programType: quota.programType } });
      if (!existing) {
        quota.school = primary;
        await this.quotaRepo.save(quota);
      } else {
        await this.quotaRepo.remove(quota);
      }
    }

    // Move cutoffs
    const secondaryCutoffs = await this.cutoffRepo.find({ where: { school: { id: secondaryId } } });
    for (const cutoff of secondaryCutoffs) {
      const existing = await this.cutoffRepo.findOne({ where: { school: { id: primaryId }, year: cutoff.year, programType: cutoff.programType } });
      if (!existing) {
        cutoff.school = primary;
        await this.cutoffRepo.save(cutoff);
      } else {
        await this.cutoffRepo.remove(cutoff);
      }
    }

    // Update primary
    Object.assign(primary, mergedData);
    await this.schoolRepo.save(primary);

    // Soft delete secondary
    secondary.isActive = false;
    secondary.code = \`\${secondary.code}_merged_\${Date.now()}\`;
    await this.schoolRepo.save(secondary);

    return primary;
  }
`;

serviceContent = serviceContent.replace(/}\s*$/, serviceMethod + '\n}');
fs.writeFileSync(servicePath, serviceContent, 'utf8');


const controllerPath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/controllers/grade10-school.controller.ts');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

const controllerMethod = `
  @Post('merge')
  @ApiOperation({ summary: 'Merge two high schools' })
  @RequirePermission('GRADE10', 'edit_data', 'edit')
  async mergeSchools(
    @Body('primaryId') primaryId: string,
    @Body('secondaryId') secondaryId: string,
    @Body('mergedData') mergedData: any,
  ) {
    return this.schoolService.mergeSchools(primaryId, secondaryId, mergedData);
  }
`;

controllerContent = controllerContent.replace(/}\s*$/, controllerMethod + '\n}');
fs.writeFileSync(controllerPath, controllerContent, 'utf8');

console.log('Backend patched successfully');
