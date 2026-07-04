const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT s.name, s.code, c.cutoff_nv1 
    FROM "G10HCM_CUTOFF_SCORE" c
    JOIN "G10HCM_SCHOOL" s ON c.school_id = s.id
    WHERE c.year = 2025 AND c.program_type = 'REGULAR'
  `);
  console.log("Found:", res.rows.length);
  console.log(res.rows);
  await client.end();
}

run();
