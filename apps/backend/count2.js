const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect().then(() => {
  client.query("SELECT COUNT(*) FROM \"G10HCM_CUTOFF_SCORE\" WHERE year = 2025 AND program_type = 'REGULAR'").then(res => {
    console.log("Total cutoffs in 2025: ", res.rows[0]);
    client.end();
  });
});
