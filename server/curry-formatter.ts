export function formatCurryOptions(options: any[], mealId?: number | null) {
  if (options.length === 0) return [];
  
  if (typeof options[0] === 'object' && !Array.isArray(options[0])) {
    return options.map(option => ({
      id: option.id,
      name: option.name,
      price: option.priceAdjustment || option.price || 0
    }));
  }
  
  if (Array.isArray(options[0])) {
    return options.map(option => ({
      id: option[0],
      name: option[1],
      price: option[2]
    }));
  }
  
  return [];
}

export function formatMealCurryOptions(meal: any, globalOptions: any[]) {
  let curryOptions = [];
  
  if (meal.curryOptions && meal.curryOptions.length > 0) {
    curryOptions = formatCurryOptions(meal.curryOptions);
  } else {
    const mealSpecificOptions = globalOptions.filter(option => {
      const directMatch = option.mealId === meal.id;
      const arrayMatch = Array.isArray(option.mealIds) && 
                         option.mealIds.length > 0 && 
                         option.mealIds.includes(meal.id);
      
      return directMatch || arrayMatch;
    });
    
    curryOptions = formatCurryOptions(mealSpecificOptions);
  }
  
  return {
    ...meal,
    curryOptions
  };
}