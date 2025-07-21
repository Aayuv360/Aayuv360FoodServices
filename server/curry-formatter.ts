export function formatCurryOptions(options: any[]) {
  return options.map((option: any) => ({
    id: option.id,
    name: option.name,
    priceAdjustment: option.priceAdjustment,
    description: option.description,
  }));
}
