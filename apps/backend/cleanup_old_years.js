const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  console.log("Connected to DB.");
  try {
    const res1 = await client.query('DELETE FROM "G10HCM_CUTOFF_SCORE" WHERE year < 2022;');
    console.log(`Deleted ${res1.rowCount} old cutoff rows.`);
    
    const res2 = await client.query('DELETE FROM "G10HCM_QUOTA" WHERE year < 2022;');
    console.log(`Deleted ${res2.rowCount} old quota rows.`);
    
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
