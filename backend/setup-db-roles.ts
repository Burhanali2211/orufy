import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const adminPool = new Pool({
    connectionString: "postgres://postgres:password@localhost:5433/platform_db"
  });

  try {
    await adminPool.query("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'platform_app') THEN CREATE ROLE platform_app WITH LOGIN PASSWORD 'app_password'; END IF; END $$;");
    await adminPool.query("GRANT ALL PRIVILEGES ON DATABASE platform_db TO platform_app;");
    await adminPool.query("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO platform_app;");
    await adminPool.query("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO platform_app;");
    
    // Explicitly set nosuperuser and nobypassrls
    await adminPool.query("ALTER ROLE platform_app NOSUPERUSER NOBYPASSRLS;");
    
    console.log("Created platform_app role and granted privileges.");
  } catch (err) {
    console.error("Admin DB Query Failed:", err);
  } finally {
    await adminPool.end();
  }

  // Now test with the platform_app user
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
