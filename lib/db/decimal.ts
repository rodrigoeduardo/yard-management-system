function decimalPlaces(value: string): number {
  const dotIndex = value.indexOf(".");
  return dotIndex === -1 ? 0 : value.length - dotIndex - 1;
}

function toScaledBigInt(value: string, scale: number): bigint {
  const negative = value.startsWith("-");
  const abs = negative ? value.slice(1) : value;
  const [intPart, fracPart = ""] = abs.split(".");
  const paddedFrac = fracPart.padEnd(scale, "0");
  const digits = `${intPart}${paddedFrac}` || "0";
  const magnitude = BigInt(digits);
  return negative ? -magnitude : magnitude;
}

function fromScaledBigInt(value: bigint, scale: number): string {
  const negative = value < BigInt(0);
  const digits = (negative ? -value : value).toString().padStart(scale + 1, "0");
  const intPart = scale === 0 ? digits : digits.slice(0, -scale);
  const fracPart = scale === 0 ? "" : digits.slice(-scale).replace(/0+$/, "");
  const unsigned = fracPart ? `${intPart}.${fracPart}` : intPart;
  return negative && unsigned !== "0" ? `-${unsigned}` : unsigned;
}

/** Sums Postgres `numeric`-backed decimal strings without floating-point drift. */
export function sumDecimalStrings(values: string[]): string {
  const scale = values.reduce((max, v) => Math.max(max, decimalPlaces(v)), 0);
  const total = values.reduce(
    (sum, v) => sum + toScaledBigInt(v, scale),
    BigInt(0),
  );
  return fromScaledBigInt(total, scale);
}

/** Subtracts two Postgres `numeric`-backed decimal strings without floating-point drift. */
export function subtractDecimalStrings(a: string, b: string): string {
  const scale = Math.max(decimalPlaces(a), decimalPlaces(b));
  return fromScaledBigInt(
    toScaledBigInt(a, scale) - toScaledBigInt(b, scale),
    scale,
  );
}
