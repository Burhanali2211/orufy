
import { db } from './apps/api/src/lib/db';
import { users } from './db/schema';

async function checkUsers() {
  const allUsers = await db.select().from(users);
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
