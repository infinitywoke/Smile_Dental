const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:64322/postgres'
});

async function run() {
  await client.connect();
  let res = await client.query(`
    SELECT tgname, relname, pg_get_triggerdef(pg_trigger.oid) AS trigger_def 
    FROM pg_trigger 
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
    WHERE relname = 'clinical_records';
  `);
  console.log("clinical_records triggers:", res.rows);
  
  res = await client.query(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname LIKE '%protect%';
  `);
  console.log("protect functions:", res.rows);
  
  await client.end();
}
run();
