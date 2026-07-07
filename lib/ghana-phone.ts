// lib/ghana-phone.ts
// Single source of truth for Ghana phone number handling.
// Used by validation schemas, Bridge payment conversion, and display formatting.

// ── Network prefix maps ───────────────────────────────────────────────────────
// Source: NCA Ghana operator prefix allocations (2024)

const MTN_PREFIXES       = ["024", "025", "053", "054", "055", "059"];
const TELECEL_PREFIXES   = ["020", "050"];
const AIRTELTIGO_PREFIXES = ["026", "027", "056", "057", "023"];

export const ALL_VALID_PREFIXES = [
  ...MTN_PREFIXES,
  ...TELECEL_PREFIXES,
  ...AIRTELTIGO_PREFIXES,
];

export type GhanaMomoNetwork = "MTN" | "TELECEL" | "AIRTELTIGO";

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validates a Ghana local phone number (0XXXXXXXXX format).
 * Checks both length (10 digits) and valid network prefix.
 */
export function isValidGhanaPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/\s/g, "");
  if (!/^\d{10}$/.test(cleaned)) return false;
  const prefix = cleaned.slice(0, 3);
  return ALL_VALID_PREFIXES.includes(prefix);
}

/**
 * Validates a phone in international format (233XXXXXXXXX).
 */
export function isValidInternationalPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/\s/g, "");
  if (!/^233\d{9}$/.test(cleaned)) return false;
  const prefix = "0" + cleaned.slice(3, 6);
  return ALL_VALID_PREFIXES.includes(prefix);
}

// ── Conversion ────────────────────────────────────────────────────────────────

/**
 * Converts any Ghana phone format to Bridge international format.
 *
 * Accepts:
 *   0542480731    → 233542480731
 *   +233542480731 → 233542480731
 *   233542480731  → 233542480731 (already correct)
 *
 * Returns null if the input is not a recognisable Ghana phone number.
 */
export function toInternational(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s\-]/g, "");

  // Already international without +
  if (/^233\d{9}$/.test(cleaned)) return cleaned;

  // International with +
  if (/^\+233\d{9}$/.test(cleaned)) return cleaned.slice(1);

  // Local format
  if (/^0\d{9}$/.test(cleaned)) return "233" + cleaned.slice(1);

  return null;
}

/**
 * Converts international format back to local display format.
 * 233542480731 → 0542480731
 */
export function toLocal(phone: string): string {
  const cleaned = phone.trim().replace(/\s/g, "");
  if (/^233\d{9}$/.test(cleaned)) return "0" + cleaned.slice(3);
  return cleaned;
}

/**
 * Formats a local number for display: 0542480731 → 054 248 0731
 */
export function formatForDisplay(phone: string): string {
  const local = toLocal(phone);
  if (local.length !== 10) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

// ── Network detection ─────────────────────────────────────────────────────────

/**
 * Detects the MoMo network from a local Ghana phone number.
 * Returns null if the number is not a known MoMo prefix.
 */
export function detectNetwork(phone: string): GhanaMomoNetwork | null {
  const local = phone.startsWith("233")
    ? "0" + phone.slice(3)
    : phone.trim();

  const prefix = local.slice(0, 3);

  if (MTN_PREFIXES.includes(prefix))       return "MTN";
  if (TELECEL_PREFIXES.includes(prefix))   return "TELECEL";
  if (AIRTELTIGO_PREFIXES.includes(prefix)) return "AIRTELTIGO";

  return null;
}

/**
 * Maps detected network to Bridge API's nw codes.
 */
export const NETWORK_TO_BRIDGE: Record<GhanaMomoNetwork, string> = {
  MTN:        "MTN",
  TELECEL:    "VOD",
  AIRTELTIGO: "AIR",
};