const fs = require('fs');
const path = require('path');

// 1. Patch DTO
const dtoPath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/dtos/school-crud.dto.ts');
let dtoContent = fs.readFileSync(dtoPath, 'utf8');

if (!dtoContent.includes('comments?: string')) {
  dtoContent = dtoContent.replace(
    "@IsOptional()\n  isActive?: boolean;",
    "@IsOptional()\n  isActive?: boolean;\n\n  @IsString()\n  @IsOptional()\n  comments?: string;\n\n  @IsOptional()\n  cutoffs?: any[];\n\n  @IsOptional()\n  quotas?: any[];"
  );
  fs.writeFileSync(dtoPath, dtoContent, 'utf8');
}

// 2. Patch Service
const servicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-school.service.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

if (!serviceContent.includes('if (dto.cutoffs) {')) {
  const updateLogic = `
    const { cutoffs, quotas, ...basicData } = dto;
    Object.assign(school, basicData);
    await this.schoolRepo.save(school);

    if (cutoffs && Array.isArray(cutoffs)) {
      await this.cutoffRepo.delete({ schoolId: id });
      const newCutoffs = cutoffs.map(c => this.cutoffRepo.create({ ...c, schoolId: id }));
      await this.cutoffRepo.save(newCutoffs);
    }

    if (quotas && Array.isArray(quotas)) {
      await this.quotaRepo.delete({ schoolId: id });
      const newQuotas = quotas.map(q => this.quotaRepo.create({ ...q, schoolId: id }));
      await this.quotaRepo.save(newQuotas);
    }

    return this.findOne(id);
`;

  serviceContent = serviceContent.replace(
    /Object\.assign\(school, dto\);\s*await this\.schoolRepo\.save\(school\);\s*return this\.findOne\(id\);/g,
    updateLogic.trim()
  );
  fs.writeFileSync(servicePath, serviceContent, 'utf8');
}

console.log("Backend patched for Edit School");
