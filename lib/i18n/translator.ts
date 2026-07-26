/**
 * Every dot-notation path through a dictionary object that resolves to a
 * string leaf — e.g. `"login.errors.invalidInput"`. Keeps `t()` calls
 * type-checked against the dictionary shape instead of accepting any string.
 */
type DotPath<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: DotPath<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

/**
 * Builds the `t()` helper for a resolved dictionary (see `get-dictionary.ts`).
 * A missing key throws rather than silently rendering `undefined` — a typo
 * here should fail loudly (tests, or worst case a visible error) rather than
 * ship a blank string to the yard operators.
 */
export function createTranslator<T extends Record<string, unknown>>(dictionary: T) {
  return function t(key: DotPath<T>): string {
    const value = (key as string).split(".").reduce<unknown>((node, segment) => {
      if (node && typeof node === "object" && segment in node) {
        return (node as Record<string, unknown>)[segment];
      }
      return undefined;
    }, dictionary);

    if (typeof value !== "string") {
      throw new Error(`Missing i18n key: "${key}"`);
    }

    return value;
  };
}
