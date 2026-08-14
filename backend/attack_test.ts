import { db } from "./src/db/db";
import { stores, products } from "./src/db/schema";
import { withStoreContext } from "./src/db/utils";
import { eq } from "drizzle-orm";

async function attackTest() {
  console.log("Setting up Test Stores...");
  
  const ts = Date.now();
  const [storeA] = await db.insert(stores).values({ name: "Store A", hostname: `store-a-${ts}.com` }).returning();
  const [storeB] = await db.insert(stores).values({ name: "Store B", hostname: `store-b-${ts}.com` }).returning();
  
  console.log("Store A:", storeA.id);
  console.log("Store B:", storeB.id);

  console.log("Inserting Product B into Store B (as admin/global)...");
  // Bypass RLS manually to seed data as global
  // Actually wait, Drizzle runs as platform_app which is NOT superuser, 
  // so we can't seed data outside context! 
  // We MUST seed data using the context of Store B!
  const productB = await withStoreContext(storeB.id, async (tx) => {
    const [p] = await tx.insert(products).values({
      store_id: storeB.id,
      name: "Product B",
      slug: "product-b",
      price: "10.00"
    }).returning();
    return p;
  });
  console.log("Product B created:", productB.id);

  console.log("\n--- ATTACK SIMULATION: Authenticated as Store A ---");
  
  try {
    console.log("1. Store A -> SELECT Store B product");
    await withStoreContext(storeA.id, async (tx) => {
      const results = await tx.select().from(products).where(eq(products.id, productB.id));
      console.log("SELECT Result:", results.length === 0 ? "FAIL (Blocked, returned 0 rows)" : "SUCCESS (Leaked!)");
    });
  } catch (e: any) {
    console.log("SELECT Error:", e.message);
  }

  try {
    console.log("2. Store A -> INSERT product with Store B store_id");
    await withStoreContext(storeA.id, async (tx) => {
      await tx.insert(products).values({
        store_id: storeB.id,
        name: "Malicious Product",
        slug: "malicious",
        price: "0.00"
      });
    });
    console.log("INSERT Result: SUCCESS (Leaked!)");
  } catch (e: any) {
    console.log("INSERT Result: FAIL (Blocked!) ->", e.message);
  }
  
  try {
    console.log("3. Store A -> UPDATE Store B product");
    await withStoreContext(storeA.id, async (tx) => {
      const updateResult = await tx.update(products).set({ name: "Hacked by A" }).where(eq(products.id, productB.id)).returning();
      console.log("UPDATE Result:", updateResult.length === 0 ? "FAIL (Blocked, updated 0 rows)" : "SUCCESS (Leaked!)");
    });
  } catch (e: any) {
    console.log("UPDATE Result: Error ->", e.message);
  }

  try {
    console.log("4. Store A -> DELETE Store B product");
    await withStoreContext(storeA.id, async (tx) => {
      const deleteResult = await tx.delete(products).where(eq(products.id, productB.id)).returning();
      console.log("DELETE Result:", deleteResult.length === 0 ? "FAIL (Blocked, deleted 0 rows)" : "SUCCESS (Leaked!)");
    });
  } catch (e: any) {
    console.log("DELETE Result: Error ->", e.message);
  }
  
  process.exit(0);
}

attackTest().catch(console.error);
