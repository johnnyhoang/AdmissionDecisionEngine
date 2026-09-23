const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const migrations = [
  { oldName: 'G10HCM_SCHOOL', newName: 'ade_school' },
  { oldName: 'G10HCM_CUTOFF_SCORE', newName: 'ade_cutoff_score' },
  { oldName: 'G10HCM_QUOTA', newName: 'ade_quota' },
  { oldName: 'G10HCM_DISTRICT', newName: 'ade_district' },
  { oldName: 'G10HCM_USER', newName: 'ade_user' },
  { oldName: 'G10HCM_USER_SEARCH_HISTORY', newName: 'ade_user_search_history' },
  { oldName: 'G10HCM_IMPORT_LOG', newName: 'ade_import_log' },
  { oldName: 'G10HCM_ACTIVITY_LOG', newName: 'ade_activity_log' },
  { oldName: 'USER_PERMISSION', newName: 'ade_user_permission' },
];

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    for (const { oldName, newName } of migrations) {
      const checkOld = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
        [oldName]
      );

      const checkNew = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
        [newName]
      );

      if (checkOld.rowCount > 0 && checkNew.rowCount === 0) {
        console.log(`Renaming table "${oldName}" to "${newName}"...`);
        await client.query(`ALTER TABLE "${oldName}" RENAME TO "${newName}";`);
        console.log(`✓ Renamed "${oldName}" -> "${newName}"`);
      } else if (checkNew.rowCount > 0) {
        console.log(`ℹ Table "${newName}" already exists.`);
      } else {
        console.log(`⚠ Table "${oldName}" does not exist to rename.`);
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
