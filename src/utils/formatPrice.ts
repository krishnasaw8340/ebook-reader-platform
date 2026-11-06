/** Format a decimal price with its ISO-4217 currency; falls back to plain text. */
export function formatPrice(amount: number | string, currency?: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'N/A';
  if (!currency) return value.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
