/**
 * app/(admin)/settings/constants.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for UI dropdowns in the admin settings area.
 * Districts are derived directly from DISTRICT_CODES in rin-constants so
 * the dropdown and the RIN generator are ALWAYS in sync — no duplication.
 */

import {
  DISTRICT_CODES,
  REGION_CODES,
  CATEGORY_CODES,
} from "@/lib/rin-constants";

// ─── DISTRICTS ────────────────────────────────────────────────────────────────
// Sorted alphabetically for the dropdown
export const DISTRICTS = [
  ...Object.keys(DISTRICT_CODES).sort(),
  "National HQ",
] as const;

export type District = (typeof DISTRICTS)[number];

// ─── REGIONS ─────────────────────────────────────────────────────────────────
export const REGIONS = Object.keys(REGION_CODES).sort() as string[];

// ─── VEHICLE CATEGORIES ───────────────────────────────────────────────────────
export const VEHICLE_CATEGORIES = Object.keys(CATEGORY_CODES).sort() as string[];

// ─── ROLES ────────────────────────────────────────────────────────────────────
export const ROLES = ["Super Admin", "District Admin", "Operator"] as const;
export type Role = (typeof ROLES)[number];

// ─── STATUSES ─────────────────────────────────────────────────────────────────
export const USER_STATUSES = ["Active", "Suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];