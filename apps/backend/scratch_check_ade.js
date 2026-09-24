const { Client } = require('pg');

const db2 = 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: db2, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== ADE UNIVERSITIES ===");
  const univs = await client.query("SELECT id, code, name_vi FROM ade_universities LIMIT 10");
  console.log(univs.rows);

  console.log("=== ADE SCHOOLS (GRADE 10) ===");
  const schools = await client.query("SELECT id, code, name FROM ade_school LIMIT 10");
  console.log(schools.rows);

  console.log("=== ADE CUTOFF SCORES ===");
  const cutoffs = await client.query("SELECT id, year, cutoff_nv1 FROM ade_cutoff_score LIMIT 10");
  console.log(cutoffs.rows);

  await client.end();
}

main().catch(console.error);
