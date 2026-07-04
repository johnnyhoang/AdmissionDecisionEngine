const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  await client.connect();
  console.log("Connected to DB.");
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
    console.log("Extension unaccent created successfully.");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

run();
