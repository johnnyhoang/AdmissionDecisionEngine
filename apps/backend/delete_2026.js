const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT * FROM "G10HCM_CUTOFF_SCORE" WHERE year = 2026
  `);
  console.log(res.rows);
  
  // Actually, I'll just delete them right here.
  await client.query(`
    DELETE FROM "G10HCM_CUTOFF_SCORE" WHERE year = 2026
  `);
  console.log("Deleted 2026 records.");
  await client.end();
}

run();
