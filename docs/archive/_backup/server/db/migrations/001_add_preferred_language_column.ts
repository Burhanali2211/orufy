import { query } from '../../db/connection';

/**
 * Migration to add preferred_language column to profiles table
 * This column exists in the schema.sql but may be missing from existing databases
 */
async function up() {
  try {
    // Check if the column already exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'preferred_language'
    `);

    if (columnCheck.rows.length === 0) {
      // Add the preferred_language column if it doesn't exist
      await query(`
        ALTER TABLE public.profiles 
        ADD COLUMN preferred_language TEXT DEFAULT 'en'
      `);
      console.log('✅ Added preferred_language column to profiles table');
    } else {
      console.log('✅ preferred_language column already exists');
    }

    // Also add newsletter_subscribed column if it doesn't exist
    const newsletterColumnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'newsletter_subscribed'
    `);

    if (newsletterColumnCheck.rows.length === 0) {
      await query(`
        ALTER TABLE public.profiles 
        ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false
      `);
      console.log('✅ Added newsletter_subscribed column to profiles table');
    } else {
      console.log('✅ newsletter_subscribed column already exists');
    }
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove the columns if they exist
    await query(`
      ALTER TABLE public.profiles 
      DROP COLUMN IF EXISTS preferred_language
    `);
    console.log('✅ Removed preferred_language column from profiles table');

    await query(`
      ALTER TABLE public.profiles 
      DROP COLUMN IF EXISTS newsletter_subscribed
    `);
    console.log('✅ Removed newsletter_subscribed column from profiles table');
  } catch (error) {
    console.error('❌ Error reverting migration:', error);
    throw error;
  }
}

export { up, down };