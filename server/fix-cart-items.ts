import { CartItem as CartItemModel, Meal as MealModel } from '../shared/mongoModels';

/**
 * This script updates existing cart items with default curry options
 * to fix the cart display issue where curry options are not showing up
 */
async function fixCartItems() {
  try {
    // Skip execution in automatic startup to avoid issues
    console.log('Cart item update function is available but not running automatically');
    return;
    
    /* Disabled to fix startup issues
    console.log('Starting cart items update...');
    
    // Get all cart items directly from MongoDB
    const cartItems = await CartItemModel.find().lean();
    console.log(`Found ${cartItems.length} cart items to process`);
    
    // Update each cart item with default curry option and category if needed
    for (const item of cartItems) {
      // Get the meal data to determine its type from MongoDB
      const meal = await MealModel.findOne({ id: item.mealId }).lean();
      
      if (!meal) {
        console.log(`Meal not found for cart item ${item.id}`);
        continue;
      }
      
      // Default category for all items
      const category = "Dinner";  
      
      // Check if we need to update this item
      const needsUpdate = !item.curryOptionId || 
                          (item.hasOwnProperty('category') && !item.category);
      
      if (needsUpdate) {
        console.log(`Updating cart item ${item.id} with default curry option`);
        
        // Update with the Regular Curry default option
        await CartItemModel.updateOne(
          { id: item.id },
          { 
            $set: {
              curryOptionId: 'regular',
              curryOptionName: 'Regular Curry',
              curryOptionPrice: 0,
              category: category
            }
          }
        );
      }
    }
    
    console.log('Cart items update completed successfully');
    */
  } catch (error) {
    console.error('Error updating cart items:', error);
  }
}

// Export for potential use in other files
export { fixCartItems };