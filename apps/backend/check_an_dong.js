const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT * FROM "G10HCM_SCHOOL" WHERE name ILIKE '%An Đông%' OR code ILIKE '%AN_DONG%'
  `);
  console.log("Found:", res.rows.length);
  console.log(res.rows);
  await client.end();
}

run();
