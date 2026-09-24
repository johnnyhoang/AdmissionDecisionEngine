const { Client } = require('pg');

const db1 = 'postgresql://postgres.msozshwatonyxnkaqjfs:H0angh0a1256@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';
const db2 = 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function inspectDb(url, label) {
  console.log(`\n=================== INSPECTING ${label} ===================`);
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Total public tables in ${label}: ${tables.length}`);

    for (const t of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${t}"`);
        const count = countRes.rows[0].count;
        console.log(`- ${t}: ${count} rows`);
      } catch (e) {
        console.log(`- ${t}: Error getting count (${e.message})`);
      }
    }
  } catch (e) {
    console.error(`Error connecting to ${label}:`, e.message);
  } finally {
    await client.end();
  }
}

async function run() {
  await inspectDb(db1, 'Project 1 (msozshwatonyxnkaqjfs)');
  await inspectDb(db2, 'Project 2 (czngbleeeiljsrpbaksg)');
}

run();
