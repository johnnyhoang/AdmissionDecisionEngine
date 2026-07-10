const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const batchFile = path.join(__dirname, '../../data/imports/g10hcm_activities_regulations_batch2.json');

async function importBatch() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read batch file
    const data = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
    console.log(`Read ${data.length} schools from batch file`);

    let updated = 0;
    let failed = 0;

    for (const school of data) {
      try {
        const result = await client.query(
          `UPDATE "G10HCM_SCHOOL"
           SET activities = $1, regulations = $2, updated_at = NOW()
           WHERE code = $3`,
          [school.activities, school.regulations, school.school]
        );

        if (result.rowCount > 0) {
          updated++;
          console.log(`✓ ${school.school}`);
        } else {
          failed++;
          console.log(`✗ ${school.school} (not found)`);
        }
      } catch (err) {
        failed++;
        console.error(`✗ ${school.school}: ${err.message}`);
      }
    }

    console.log(`\nImport complete: ${updated} updated, ${failed} failed`);

    // Verify
    const verify = await client.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN activities IS NOT NULL AND length(activities) > 50 THEN 1 END) as with_activities
       FROM "G10HCM_SCHOOL" WHERE is_active = true`
    );
    console.log(`\nVerify: ${verify.rows[0].total} active schools, ${verify.rows[0].with_activities} with activities data`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

importBatch();
