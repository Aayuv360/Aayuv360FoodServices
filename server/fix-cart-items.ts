import { CartItem as CartItemModel, Meal as MealModel } from '../shared/mongoModels';

/**
 * This script updates existing cart items with default curry options
 * to fix the cart display issue where curry options are not showing up
 */
async function fixCartItems() {
  try {
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
      
      // Determine which category to assign
      let category = "Dinner";  // Default category
      
      // Check if we need to update this item
      if (!item.curryOptionId || !item.category) {
        console.log(`Updating cart item ${item.id} with default curry option and category`);
        
        // Update with the Regular Curry default option and category using MongoDB
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
  } catch (error) {
    console.error('Error updating cart items:', error);
  }
}

// Don't execute immediately to avoid startup issues
// fixCartItems();

// Export for potential use in other files
export { fixCartItems };