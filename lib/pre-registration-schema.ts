// lib/pre-registration-schema.ts

import { z } from "zod";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";
import {
  isValidGhanaPhone,
  toInternational,
  ALL_VALID_PREFIXES,
} from "@/lib/ghana-phone";

const DISTRICTS    = Object.keys(DISTRICT_CODES) as [string, ...string[]];
const VEHICLE_TYPES = Object.keys(CATEGORY_CODES) as [string, ...string[]];
const GENDERS      = ["Male", "Female", "Other"] as const;
const ID_TYPES     = ["GHANA_CARD", "VOTERS_ID", "PASSPORT"] as const;

// ── Reusable field builders ───────────────────────────────────────────────────

/**
 * Ghana phone field — local format (0XXXXXXXXX).
 * Validates length AND network prefix.
 * Use toInternational() before sending to Bridge.
 */
const ghanaPhoneField = (label = "Phone number") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(
      (v) => /^\d{10}$/.test(v.replace(/\s/g, "")),
      `${label} must be exactly 10 digits`,
    )
    .refine(
      (v) => isValidGhanaPhone(v.replace(/\s/g, "")),
      `${label} must start with a valid Ghana network prefix (e.g. 024, 054, 020, 027). Valid prefixes: ${ALL_VALID_PREFIXES.join(", ")}`,
    );

/**
 * Name field — allows letters, spaces, hyphens, and apostrophes.
 * "Asante-Mensah" and "O'Brien" are valid Ghanaian name formats.
 */
const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(3, `${label} must be at least 3 characters`)
    .max(100, `${label} is too long`)
    .regex(
      /^[a-zA-Z\s'\-]+$/,
      `${label} must contain only letters, spaces, hyphens, or apostrophes`,
    );

// ── Age calculator ────────────────────────────────────────────────────────────

function calculateAge(dateString: string): number | null {
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  // Reject future dates before calculating age
  if (dob > today) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ── ID format validators ──────────────────────────────────────────────────────

const ID_VALIDATORS: Record<string, { regex: RegExp; message: string }> = {
  GHANA_CARD: {
    // Normalised to uppercase before test — handles lowercase input
    regex:   /^GHA-\d{9}-\d$/,
    message: "Invalid Ghana Card format. Expected: GHA-712014412-4",
  },
  VOTERS_ID: {
    regex:   /^\d{10}$/,
    message: "Invalid Voter's ID format. Expected: 4393000029 (10 digits)",
  },
  PASSPORT: {
    // Ghana passports: 1 letter + 6–8 digits (e.g. G2282683)
    regex:   /^[A-Z]\d{6,8}$/,
    message: "Invalid Passport format. Expected: G2282683 (1 letter + 6–8 digits)",
  },
};

// ── Base schema ───────────────────────────────────────────────────────────────
// superRefine is NOT on the base — keeps .pick() working for step validation.

const preRegistrationBaseSchema = z.object({

  fullName: nameField("Full name"),

  phoneNumber: ghanaPhoneField("Phone number"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((d) => {
      const dob = new Date(d);
      return !isNaN(dob.getTime()) && dob < new Date();
    }, "Date of birth cannot be in the future")
    .refine((d) => {
      const age = calculateAge(d);
      return age !== null && age >= 18;
    }, "Rider must be at least 18 years old")
    .refine((d) => {
      const age = calculateAge(d);
      return age !== null && age <= 100;
    }, "Please enter a valid date of birth"),

  gender: z.enum(GENDERS, {
    message: "Please select a gender",
  }),

  idType: z.enum(ID_TYPES, {
    message: "Please select an ID type",
  }),

  // Raw value — format checked in superRefine after idType is known
  idNumber: z
    .string()
    .trim()
    .min(5, "ID number is required")
    .max(30, "ID number is too long"),

  region: z.literal("Greater Accra", {
    message: "Region must be Greater Accra",
  }),

  districtMunicipality: z.enum(DISTRICTS, {
    message: "Please select a valid district",
  }),

  residentialTown: z
    .string()
    .trim()
    .min(2, "Town name must be at least 2 characters")
    .max(50, "Town name is too long")
    .regex(
      /^[a-zA-Z\s\-]+$/,
      "Town name must contain only letters, spaces, or hyphens",
    ),

  vehicleCategory: z.enum(VEHICLE_TYPES, {
    message: "Please select a vehicle category",
  }),

  nextOfKinName: nameField("Next of kin name"),

  nextOfKinContact: ghanaPhoneField("Next of kin phone number"),
});

// ── Step schemas (picked from base) ──────────────────────────────────────────

export const preBioSchema = preRegistrationBaseSchema.pick({
  fullName:    true,
  phoneNumber: true,
  dateOfBirth: true,
  gender:      true,
});

export const preIdSchema = preRegistrationBaseSchema.pick({
  idType:   true,
  idNumber: true,
});

export const preLocationSchema = preRegistrationBaseSchema.pick({
  region:               true,
  districtMunicipality: true,
  residentialTown:      true,
});

export const preVehicleSchema = preRegistrationBaseSchema.pick({
  vehicleCategory: true,
});

export const preKinSchema = preRegistrationBaseSchema.pick({
  nextOfKinName:    true,
  nextOfKinContact: true,
});

// ── Full schema with cross-field rules ────────────────────────────────────────

export const preRegistrationSchema = preRegistrationBaseSchema.superRefine(
  ({ idType, idNumber, phoneNumber, nextOfKinContact }, ctx) => {

    // 1. ID format validation — normalise to uppercase first
    const normalized = idNumber.trim().toUpperCase();
    const validator = ID_VALIDATORS[idType];
    if (validator && !validator.regex.test(normalized)) {
      ctx.addIssue({
        path:    ["idNumber"],
        message: validator.message,
        code:    z.ZodIssueCode.custom,
      });
    }

    // 2. Next of kin must not be the same number as the rider
    const cleanRider = phoneNumber.trim().replace(/\s/g, "");
    const cleanKin   = nextOfKinContact.trim().replace(/\s/g, "");
    if (cleanRider && cleanKin && cleanRider === cleanKin) {
      ctx.addIssue({
        path:    ["nextOfKinContact"],
        message: "Next of kin phone number must be different from your own number",
        code:    z.ZodIssueCode.custom,
      });
    }

    // 3. Confirm Bridge can receive this phone in international format
    const international = toInternational(cleanRider);
    if (cleanRider && !international) {
      ctx.addIssue({
        path:    ["phoneNumber"],
        message: "Phone number could not be converted to international format. Please check the number.",
        code:    z.ZodIssueCode.custom,
      });
    }
  },
);

export type PreRegistrationData = z.infer<typeof preRegistrationSchema>;