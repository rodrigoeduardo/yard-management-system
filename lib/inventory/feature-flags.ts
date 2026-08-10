/**
 * FEATURE_ITEM_WEIGHT_EDIT is server-only. Client components receive the
 * computed boolean so an unset flag leaves both UI and action paths inert.
 */
export function isItemWeightEditEnabled(): boolean {
  return process.env.FEATURE_ITEM_WEIGHT_EDIT === "true";
}
