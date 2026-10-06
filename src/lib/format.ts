/**
 * Every amount field from the backend is a JSON string, not a number -
 * Pydantic serializes Decimal that way, confirmed directly against the
 * live API's responses. Parsed to a number here for display formatting
 * only, never sent back to the API in this form.
 */
export function formatCurrency(amount: string, currencyCode: string): string {
  const value = Number.parseFloat(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Intl throws on a currency code it doesn't recognize - fall back to
    // a plain labeled number rather than crash the whole report over it.
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}
