// Helper functions to format curry options correctly
export function formatCurryOptions(options: any[], mealId?: number | null) {
  // Convert array format [id, name, price] to object format {id, name, price}
  if (options.length === 0) return [];
  
  // Check if already in object format
  if (typeof options[0] === 'object' && !Array.isArray(options[0])) {
    return options.map(option => ({
      id: option.id,
      name: option.name,
      price: option.priceAdjustment || option.price || 0
    }));
  }
  
  // If in array format [id, name, price], convert to objects
  if (Array.isArray(options[0])) {
    return options.map(option => ({
      id: option[0],
      name: option[1],
      price: option[2]
    }));
  }
  
  // Default empty
  return [];
}

export function formatMealCurryOptions(meal: any, globalOptions: any[]) {
  let curryOptions = [];
  
  // If meal has embedded curry options, use those
  if (meal.curryOptions && meal.curryOptions.length > 0) {
    curryOptions = formatCurryOptions(meal.curryOptions);
  } else {
    // Otherwise use applicable global options
    const mealSpecificOptions = globalOptions.filter(option => {
      // Only show curry options that are specifically assigned to this meal through mealIds
      // Or legacy meal ID match
      if (option.mealId === meal.id) {
        return true;
      }
      
      // Check mealIds array if it exists
      if (Array.isArray(option.mealIds) && option.mealIds.includes(meal.id)) {
        return true;
      }
      
      return false;
    });
    
    curryOptions = formatCurryOptions(mealSpecificOptions);
  }
  
  return {
    ...meal,
    curryOptions
  };
}