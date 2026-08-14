import { db } from "./db";
import { sql } from "drizzle-orm";

export async function withStoreContext<T>(
  storeId: string,
  callback: (tx: any) => Promise<T>,
  userId?: string
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Defense in depth: Set the PostgreSQL local session variable so that RLS policies
    // can restrict rows to ONLY this store_id.
    await tx.execute(sql`SELECT set_config('app.current_store_id', ${storeId}, true)`);
    
    // Set the current_user_id for RLS policies simulating auth.uid()
    if (userId) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    } else {
      await tx.execute(sql`SELECT set_config('app.current_user_id', '', true)`);
    }
    
    // Execute the actual queries inside this transaction
    return await callback(tx);
  });
}

export async function withUserContext<T>(
  userId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return await callback(tx);
  });
}
