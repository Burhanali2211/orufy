import { db } from "./db";
import { sql } from "drizzle-orm";

async function applyRLS() {
  console.log("Applying RLS policies...");
  
  await db.execute(sql`
    -- Enable RLS on tables
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for products
    DROP POLICY IF EXISTS products_store_isolation ON products;
    CREATE POLICY products_store_isolation ON products
      FOR ALL
      USING (store_id = current_setting('app.current_store_id')::uuid)
      WITH CHECK (store_id = current_setting('app.current_store_id')::uuid);

    -- Create policies for categories
    DROP POLICY IF EXISTS categories_store_isolation ON categories;
    CREATE POLICY categories_store_isolation ON categories
      FOR ALL
      USING (store_id = current_setting('app.current_store_id')::uuid)
      WITH CHECK (store_id = current_setting('app.current_store_id')::uuid);

    -- Ensure bypassing RLS is disabled unless explicitly set
  `);

  console.log("RLS policies applied successfully!");
  process.exit(0);
}

applyRLS().catch((err) => {
  console.error("Error applying RLS:", err);
  process.exit(1);
});
