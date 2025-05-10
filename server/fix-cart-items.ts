import { db, pool } from './db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * This script updates existing cart items with default curry options
 * to fix the cart display issue where curry options are not showing up
 */
async function fixCartItems() {
  try {
    console.log('Starting cart items update...');
    
    // Get all cart items
    const cartItems = await db.select().from(schema.cartItems);
    console.log(`Found ${cartItems.length} cart items to process`);
    
    // Update each cart item with default curry option and category if needed
    for (const item of cartItems) {
      // Get the meal data to determine its type
      const meal = await db.select().from(schema.meals)
        .where(eq(schema.meals.id, item.mealId))
        .then(meals => meals[0]);
      
      if (!meal) {
        console.log(`Meal not found for cart item ${item.id}`);
        continue;
      }
      
      // Determine which category to assign
      let category = "Dinner";  // Default category
      
      // Check if we need to update this item
      if (!item.curryOptionId || !item.category) {
        console.log(`Updating cart item ${item.id} with default curry option and category`);
        
        // Update with the Regular Curry default option and category
        await db.update(schema.cartItems)
          .set({
            curryOptionId: 'regular',
            curryOptionName: 'Regular Curry',
            curryOptionPrice: 0,
            category: category
          })
          .where(eq(schema.cartItems.id, item.id));
      }
    }
    
    console.log('Cart items update completed successfully');
  } catch (error) {
    console.error('Error updating cart items:', error);
  } finally {
    // Don't close the pool here as it might be used by other parts of the app
  }
}

// Execute immediately
fixCartItems();

// Export for potential use in other files
export { fixCartItems };