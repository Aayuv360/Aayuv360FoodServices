import { db, pool } from './db';
import * as schema from '@shared/schema';

async function updateDatabase() {
  try {
    console.log('Starting database schema update...');
    
    // Execute SQL directly to avoid interactive prompts
    await pool.query(`
      -- Add subscription_status enum type if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
          CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
        END IF;
      END $$;
      
      -- Add new columns to subscriptions table
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS status subscription_status DEFAULT 'pending' NOT NULL,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS payment_id TEXT,
      ADD COLUMN IF NOT EXISTS order_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_signature TEXT,
      ADD COLUMN IF NOT EXISTS dietary_preference TEXT,
      ADD COLUMN IF NOT EXISTS person_count INTEGER DEFAULT 1;
    `);
    
    console.log('Database schema update completed successfully.');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateDatabase();