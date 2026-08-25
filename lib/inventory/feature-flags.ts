/**
 * FEATURE_ITEM_WEIGHT_EDIT is server-only. Client components receive the
 * computed boolean so an unset flag leaves both UI and action paths inert.
 */
export function isItemWeightEditEnabled(): boolean {
  return process.env.FEATURE_ITEM_WEIGHT_EDIT === "true";
}

/**
 * FEATURE_LOAD_EDIT is server-only, same shape as FEATURE_ITEM_WEIGHT_EDIT
 * above. Client components receive the computed boolean so an unset flag
 * leaves both UI and action paths inert (#352).
 */
export function isLoadEditEnabled(): boolean {
  return process.env.FEATURE_LOAD_EDIT === "true";
}
