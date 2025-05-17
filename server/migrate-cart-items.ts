// This file is now deprecated since migration to MongoDB is complete
// Keeping file for reference but disabling imports
// import { db } from './db';
// import { sql } from 'drizzle-orm';
// import { cartItems } from '@shared/schema';

async function migrateDatabaseCartItems() {
  console.log('Starting cart items migration...');
  
  try {
    // Check if the category column exists
    const columnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cart_items' AND column_name = 'category'
    `);
    
    const columns = columnsResult.rows;
    
    if (columns.length === 0) {
      console.log('Category column does not exist in cart_items table. Adding it...');
      
      // Add the category column
      await db.execute(sql`
        ALTER TABLE cart_items 
        ADD COLUMN category TEXT
      `);
      
      console.log('Category column added successfully!');
    } else {
      console.log('Category column already exists in cart_items table.');
    }
    
    console.log('Cart items migration completed successfully!');
  } catch (error) {
    console.error('Error during cart items migration:', error);
  }
}

// This function is imported and called directly from routes.ts

export default migrateDatabaseCartItems;