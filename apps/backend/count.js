const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.czngbleeeiljsrpbaksg:B1gh13u1977dtnt@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
client.connect().then(() => {
  client.query('SELECT COUNT(*) FROM "G10HCM_SCHOOL"').then(res => {
    console.log("Total schools: ", res.rows[0]);
    client.end();
  });
});
