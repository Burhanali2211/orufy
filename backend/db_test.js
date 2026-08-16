const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const res = await pool.query(`
    SELECT p.id, p.email, p.role as user_role, sm.role as store_role, s.hostname 
    FROM profiles p 
    LEFT JOIN store_members sm ON p.id = sm.user_id 
    LEFT JOIN stores s ON sm.store_id = s.id
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
}

run().catch(console.error);
