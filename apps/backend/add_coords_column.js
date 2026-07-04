const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  console.log("Connected to DB.");
  try {
    await client.query('ALTER TABLE "G10HCM_SCHOOL" ADD COLUMN latitude double precision;');
    await client.query('ALTER TABLE "G10HCM_SCHOOL" ADD COLUMN longitude double precision;');
    console.log("Columns latitude and longitude added successfully.");
  } catch (err) {
    if (err.code === '42701') {
       console.log("Columns already exist.");
    } else {
       console.error("Error executing query:", err);
    }
  } finally {
    await client.end();
  }
}

run();
