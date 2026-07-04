const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT c.* FROM "G10HCM_CUTOFF_SCORE" c
    JOIN "G10HCM_SCHOOL" s ON c.school_id = s.id
    WHERE s.code = 'AN_DONG_Q12'
  `);
  console.log(res.rows);
  await client.end();
}

run();
