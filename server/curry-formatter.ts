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
    console.log(`Finding curry options for meal id: ${meal.id}`);
    
    // Filter to include ONLY options specifically assigned to this meal 
    const mealSpecificOptions = globalOptions.filter(option => {
      // STRICT matching - Only options explicitly assigned to this meal
      
      // Check direct mealId match (legacy)
      const directMatch = option.mealId === meal.id;
      
      // Check mealIds array match - preferred approach going forward
      const arrayMatch = Array.isArray(option.mealIds) && 
                         option.mealIds.length > 0 && 
                         option.mealIds.includes(meal.id);
      
      // Debug output to track which options are being assigned
      if (directMatch || arrayMatch) {
        console.log(`Curry option "${option.name}" matched meal ${meal.id}`);
      }
      
      // Only return options that have an explicit assignment to this meal
      return directMatch || arrayMatch;
    });
    
    // Format and return only the options explicitly matched to this meal
    curryOptions = formatCurryOptions(mealSpecificOptions);
  }
  
  return {
    ...meal,
    curryOptions
  };
}