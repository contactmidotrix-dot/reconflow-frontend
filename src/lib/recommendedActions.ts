import type { DiscrepancyCategory } from "../types/results";

/**
 * Static presentation copy, not computed data - there's no such field
 * anywhere in the backend, and there shouldn't be; grouping and totals
 * are data, but "what should a human do about it" is editorial judgment
 * that belongs in the frontend, where it's one line to revise rather
 * than a migration.
 */
export const RECOMMENDED_ACTIONS: Record<DiscrepancyCategory, string> = {
  MISSING_SETTLEMENT:
    "Contact the platform with these order IDs — they show as fulfilled in your POS but no settlement was ever received for them.",
  UNEXPECTED_SETTLEMENT:
    "Verify these orders actually happened before disputing them — the platform paid out for orders that don't appear in your POS records.",
  INCORRECT_COMMISSION:
    "Compare the charged commission against your signed contract rate and request a correction for these orders.",
  SETTLEMENT_AMOUNT_MISMATCH:
    "Request an itemized settlement statement from the platform — the amount paid doesn't match what your contract terms predict, beyond commission alone.",
  CANCELLED_AFTER_PREPARATION:
    "Likely a real cancellation after prep, not a payment dispute — worth reviewing your cancellation-loss policy with the platform rather than contesting these specific orders.",
};
