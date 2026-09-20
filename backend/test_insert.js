const { db } = require('./src/db/db');
const { site_settings } = require('./src/db/schema');
const { withStoreContext } = require('./src/db/utils');
const { v4: uuidv4 } = require('uuid');

async function test() {
  try {
    const storeId = 'e826d742-4e72-445e-ad82-275c860647b2'; // random UUID
    const userId = '7a9606d9-048a-4e36-8d16-aa9ee44168a7'; // random UUID

    await withStoreContext(storeId, async (tx) => {
      await tx.insert(site_settings).values({
        id: uuidv4(),
        store_id: storeId,
        setting_key: 'site_name',
        setting_value: 'Test Name',
        category: 'branding',
      }).onConflictDoUpdate({
        target: [site_settings.store_id, site_settings.setting_key],
        set: { setting_value: 'Test Name', updated_at: new Date() }
      });
    }, userId);

    console.log('SUCCESS');
  } catch (err) {
    console.error('ERROR OBJECT:', err);
    console.error('ERROR DETAIL:', err.detail);
    console.error('ERROR CODE:', err.code);
  }
  process.exit(0);
}
test();
