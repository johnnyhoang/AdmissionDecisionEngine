const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT COUNT(*) FROM "G10HCM_CUTOFF_SCORE" WHERE year = 2026
  `);
  console.log("Count in 2026:", res.rows[0]);
  await client.end();
}

run();
