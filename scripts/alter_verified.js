const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  console.log("Connected to DB.");
  try {
    await client.query('ALTER TABLE "G10HCM_SCHOOL" ADD COLUMN is_verified boolean DEFAULT false;');
    console.log("Column is_verified added successfully.");
  } catch (err) {
    if (err.code === '42701') {
       console.log("Column is_verified already exists.");
    } else {
       console.error("Error executing query:", err);
    }
  } finally {
    await client.end();
  }

  // 2. Patch entity
  const entityPath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/entities/school.entity.ts');
  let entityContent = fs.readFileSync(entityPath, 'utf8');
  if (!entityContent.includes('isVerified: boolean;')) {
    entityContent = entityContent.replace(
      "isActive: boolean;",
      "isActive: boolean;\n\n  @Column({ name: 'is_verified', default: false })\n  isVerified: boolean;"
    );
    fs.writeFileSync(entityPath, entityContent, 'utf8');
  }

  // 3. Patch DTO
  const dtoPath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/dtos/school-crud.dto.ts');
  let dtoContent = fs.readFileSync(dtoPath, 'utf8');
  if (!dtoContent.includes('isVerified?: boolean;')) {
    dtoContent = dtoContent.replace(
      "@IsOptional()\n  isActive?: boolean;",
      "@IsOptional()\n  isActive?: boolean;\n\n  @IsBoolean()\n  @IsOptional()\n  isVerified?: boolean;"
    ).replace(
      "@IsOptional()\n  isActive?: boolean;", // in UpdateSchoolDto
      "@IsOptional()\n  isActive?: boolean;\n\n  @IsBoolean()\n  @IsOptional()\n  isVerified?: boolean;"
    );
    fs.writeFileSync(dtoPath, dtoContent, 'utf8');
  }
}

run();
