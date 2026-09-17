const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:64322/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT polname, polcmd, polqual, polwithcheck 
    FROM pg_policy 
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
    WHERE relname = 'appointments';
  `);
  console.log(res.rows);
  await client.end();
}
run();
