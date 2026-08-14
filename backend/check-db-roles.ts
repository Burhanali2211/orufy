import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const res1 = await pool.query('SELECT current_user;');
    console.log("Current User:", res1.rows);

    const res2 = await pool.query("SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('platform_app', 'postgres');");
    console.log("Roles Info:", res2.rows);
  } catch (err) {
    console.error("DB Query Failed:", err);
  } finally {
    await pool.end();
  }
}
main();
