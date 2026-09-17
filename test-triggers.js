const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:64322/postgres' // Standard local supabase port
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT tgname, relname, pg_get_triggerdef(pg_trigger.oid) AS trigger_def 
    FROM pg_trigger 
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
    WHERE relname = 'appointments';
  `);
  console.log(res.rows);
  await client.end();
}
run();
