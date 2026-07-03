const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Read environment variables from apps/backend/.env
const envPath = path.join(__dirname, '../apps/backend/.env');
if (!fs.existsSync(envPath)) {
  console.error(`❌ Environment file not found at ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const databaseUrl = env['DATABASE_URL'] || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment file or process.env.');
  process.exit(1);
}

// 2. Load JSON data
const dataPath = path.join(__dirname, '../data/imports/g10hcm_2016_2025.json');
if (!fs.existsSync(dataPath)) {
  console.error(`❌ Data file not found at ${dataPath}`);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find District QTP
const districtData = rawData.districts.find(d => d.code === 'QTP');
if (!districtData) {
  console.error('❌ District QTP not found in g10hcm_2016_2025.json');
  process.exit(1);
}

const schoolData = districtData.schools.find(s => s.code === 'TRAN_PHU');
if (!schoolData) {
  console.error('❌ School TRAN_PHU not found in District QTP');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully.');

    // Start Transaction
    await client.query('BEGIN');

    // 1. Upsert District
    console.log(`📍 Upserting District: ${districtData.name} (${districtData.code})...`);
    let districtId;
    const distCheck = await client.query('SELECT id FROM "G10HCM_DISTRICT" WHERE code = $1', [districtData.code]);
    
    if (distCheck.rows.length > 0) {
      districtId = distCheck.rows[0].id;
      await client.query(
        'UPDATE "G10HCM_DISTRICT" SET name = $1, updated_at = NOW() WHERE id = $2',
        [districtData.name, districtId]
      );
      console.log(`   District updated (ID: ${districtId})`);
    } else {
      const distInsert = await client.query(
        'INSERT INTO "G10HCM_DISTRICT" (id, name, code, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id',
        [districtData.name, districtData.code]
      );
      districtId = distInsert.rows[0].id;
      console.log(`   District inserted (ID: ${districtId})`);
    }

    // 2. Upsert School
    console.log(`🏫 Upserting School: ${schoolData.name} (${schoolData.code})...`);
    let schoolId;
    const schoolCheck = await client.query('SELECT id FROM "G10HCM_SCHOOL" WHERE code = $1', [schoolData.code]);

    const schoolDesc = schoolData.description || 'Trường THPT Trần Phú là một trường THPT công lập lớn và có uy tín tại Thành phố Hồ Chí Minh. Được thành lập từ năm 1980, trường luôn nằm trong nhóm các trường THPT có điểm chuẩn tuyển sinh đầu vào cao của thành phố, sở hữu truyền thống hiếu học và đội ngũ giáo viên giàu kinh nghiệm, cơ sở vật chất hiện đại, đầy đủ các phòng chức năng đáp ứng tốt nhu cầu học tập và phát triển của học sinh.';
    
    if (schoolCheck.rows.length > 0) {
      schoolId = schoolCheck.rows[0].id;
      await client.query(
        `UPDATE "G10HCM_SCHOOL" 
         SET name = $1, district_id = $2, address = $3, website = $4, description = $5, map_url = $6, school_type = $7, updated_at = NOW() 
         WHERE id = $8`,
        [schoolData.name, districtId, schoolData.address, schoolData.website, schoolDesc, schoolData.mapUrl, schoolData.schoolType || 'REGULAR', schoolId]
      );
      console.log(`   School updated (ID: ${schoolId})`);
    } else {
      const schoolInsert = await client.query(
        `INSERT INTO "G10HCM_SCHOOL" 
         (id, name, code, district_id, address, website, description, map_url, school_type, is_active, created_at, updated_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()) 
         RETURNING id`,
        [schoolData.name, schoolData.code, districtId, schoolData.address, schoolData.website, schoolDesc, schoolData.mapUrl, schoolData.schoolType || 'REGULAR']
      );
      schoolId = schoolInsert.rows[0].id;
      console.log(`   School inserted (ID: ${schoolId})`);
    }

    // 3. Upsert Quotas
    console.log(`📊 Processing ${schoolData.quotas.length} Quotas...`);
    for (const q of schoolData.quotas) {
      const pt = q.programType || 'REGULAR';
      const quotaCheck = await client.query(
        'SELECT id FROM "G10HCM_QUOTA" WHERE school_id = $1 AND year = $2 AND program_type = $3',
        [schoolId, q.year, pt]
      );

      if (quotaCheck.rows.length > 0) {
        await client.query(
          `UPDATE "G10HCM_QUOTA" 
           SET quota = $1, registered_count = $2, competition_ratio = $3 
           WHERE id = $4`,
          [q.quota, q.registeredCount || 0, q.competitionRatio || 0, quotaCheck.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO "G10HCM_QUOTA" 
           (id, school_id, year, quota, registered_count, competition_ratio, program_type, created_at) 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())`,
          [schoolId, q.year, q.quota, q.registeredCount || 0, q.competitionRatio || 0, pt]
        );
      }
    }
    console.log(`   Quotas upserted.`);

    // 4. Upsert Cutoffs
    console.log(`📈 Processing ${schoolData.cutoffs.length} Cutoff Scores...`);
    for (const c of schoolData.cutoffs) {
      const pt = c.programType || 'REGULAR';
      const cutoffCheck = await client.query(
        'SELECT id FROM "G10HCM_CUTOFF_SCORE" WHERE school_id = $1 AND year = $2 AND program_type = $3',
        [schoolId, c.year, pt]
      );

      if (cutoffCheck.rows.length > 0) {
        await client.query(
          `UPDATE "G10HCM_CUTOFF_SCORE" 
           SET cutoff_nv1 = $1, cutoff_nv2 = $2, cutoff_nv3 = $3, lowest_score = $4, highest_score = $5, notes = $6, data_source = $7 
           WHERE id = $8`,
          [c.cutoffNV1, c.cutoffNV2 || null, c.cutoffNV3 || null, c.lowestScore || null, c.highestScore || null, c.notes || null, c.dataSource || rawData.sourceUrl, cutoffCheck.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO "G10HCM_CUTOFF_SCORE" 
           (id, school_id, year, cutoff_nv1, cutoff_nv2, cutoff_nv3, lowest_score, highest_score, program_type, notes, data_source, created_at) 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [schoolId, c.year, c.cutoffNV1, c.cutoffNV2 || null, c.cutoffNV3 || null, c.lowestScore || null, c.highestScore || null, pt, c.notes || null, c.dataSource || rawData.sourceUrl]
        );
      }
    }
    console.log(`   Cutoffs upserted.`);

    // Commit Transaction
    await client.query('COMMIT');
    console.log('🎉 Data successfully imported and updated in the database!');

  } catch (error) {
    console.error('❌ Error updating database:', error);
    if (client) {
      await client.query('ROLLBACK');
    }
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database.');
  }
}

main().catch(err => console.error('Fatal error:', err));
