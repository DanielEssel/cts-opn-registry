import { z } from "zod";

// ============================================================================
// REGEX PATTERNS
// ============================================================================

// Ghana Card Number validation pattern: GHA-XXXXXXXXX-X
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

// Phone number validation (10 digits)
const phoneRegex = /^\d{10}$/;

// ============================================================================
// CONSTANTS
// ============================================================================

// District codes mapping for OPN generation
export const DISTRICT_CODES: Record<string, string> = {
  "Accra Metro": "AM",
  Krowor: "KR",
  Madina: "MD",
  Ashaiman: "AS",
  "Tema Metro": "TM",
  "Ga South": "GS",
  "Ga West": "GW",
  "Ga East": "GE",
  "Ga Central": "GC",
  Ledzokuku: "LD",
  "Ablekuma North": "AN",
  "Ablekuma Central": "AC",
  "Ablekuma West": "AW",
};

// Vehicle category codes for OPN generation
export const CATEGORY_CODES: Record<string, string> = {
  Pragya: "P",
  "Motorbike/Okada": "M",
  "Tricycle/Aboboyaa": "T",
};

// ============================================================================
// STEP 1: BIO DATA SCHEMA
// ============================================================================

export const bioDataSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  phoneNumber: z
    .string()
    .regex(phoneRegex, "Phone number must be exactly 10 digits"),

  idType: z.enum(["GHANA_CARD", "PASSPORT", "DRIVERS_LICENSE"], {
    message: "Please select a valid ID type",
  }),

  idNumber: z.string().min(5, "ID number must be at least 5 characters"),

  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    return age >= 18 && age <= 100;
  }, "Rider must be at least 18 years old"),

  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender",
  }),
}).superRefine((data, ctx) => {
  // Validate Ghana Card format
  if (data.idType === "GHANA_CARD") {
    if (!ghanaCardRegex.test(data.idNumber)) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Ghana Card format (GHA-XXXXXXXXX-X)",
        code: z.ZodIssueCode.custom,
      });
    }
  }

  // Validate Passport format
  if (data.idType === "PASSPORT") {
    if (data.idNumber.length < 6) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Passport number (minimum 6 characters)",
        code: z.ZodIssueCode.custom,
      });
    }
  }

  // Validate Driver's License format
  if (data.idType === "DRIVERS_LICENSE") {
    if (data.idNumber.length < 5) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Driver's License number",
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

// ============================================================================
// STEP 2: LOCATION SCHEMA
// ============================================================================

export const locationSchema = z.object({
  region: z.literal("Greater Accra", {
    message: "Region must be Greater Accra",
  }),

  districtMunicipality: z.enum(
    [
      "Accra Metro",
      "Krowor",
      "Madina",
      "Ashaiman",
      "Tema Metro",
      "Ga South",
      "Ga West",
      "Ga East",
      "Ga Central",
      "Ledzokuku",
      "Ablekuma North",
      "Ablekuma Central",
      "Ablekuma West",
    ],
    {
      message: "Please select a valid district",
    }
  ),

  residentialTown: z
    .string()
    .min(2, "Town name must be at least 2 characters")
    .max(50, "Town name is too long")
    .regex(/^[a-zA-Z\s\-]+$/i, "Town name must contain only letters and hyphens"),
});

// ============================================================================
// STEP 3: VEHICLE INFO SCHEMA
// ============================================================================

export const vehicleInfoSchema = z.object({
  vehicleCategory: z.enum(
    ["Pragya", "Motorbike/Okada", "Tricycle/Aboboyaa"],
    {
      message: "Please select a valid vehicle category",
    }
  ),

  plateNumber: z
    .string()
    .min(2, "Plate number is required")
    .max(20, "Plate number is too long")
    .regex(/^[A-Z0-9\-]+$/i, "Invalid plate number format (letters, numbers, and hyphens only)"),

  chassisNumber: z
    .string()
    .min(10, "Chassis number must be at least 10 characters")
    .max(30, "Chassis number is too long")
    .regex(/^[A-Z0-9]+$/i, "Chassis number must be alphanumeric (letters and numbers only)"),
});

// ============================================================================
// STEP 4: COMPLIANCE SCHEMA
// ============================================================================

export const complianceSchema = z.object({
  driversLicenseNumber: z
    .string()
    .min(5, "License number must be at least 5 characters")
    .max(20, "License number is too long"),

  licenseExpiryDate: z.string().refine((date) => {
    const expiry = new Date(date);
    const today = new Date();
    return expiry > today;
  }, "License must not be expired"),

  nextOfKinContact: z
    .string()
    .regex(phoneRegex, "Next of kin contact must be exactly 10 digits"),

  passportPhoto: z
    .instanceof(File)
    .optional()
    .or(z.string().url().optional())
    .refine(
      (file) => {
        if (typeof file === "string" || !file) return true;
        return file.size <= 5 * 1024 * 1024; // 5MB max
      },
      "Photo must be less than 5MB"
    ),
});

// ============================================================================
// COMBINED REGISTRATION SCHEMA
// ============================================================================

export const riderRegistrationSchema = z.object({
  ...bioDataSchema.shape,
  ...locationSchema.shape,
  ...vehicleInfoSchema.shape,
  ...complianceSchema.shape,
});

// Backward compatibility
export const riderSchema = riderRegistrationSchema;

// ============================================================================
// LOOKUP SCHEMAS
// ============================================================================

export const ghanaCardLookupSchema = z.object({
  ghanaCardNumber: z
    .string()
    .regex(ghanaCardRegex, "Invalid Ghana Card format (GHA-XXXXXXXXX-X)"),
});

export const phoneLookupSchema = z.object({
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Phone number must be exactly 10 digits"),
});

export const opnLookupSchema = z.object({
  opn: z
    .string()
    .regex(/^[A-Z0-9\-]+$/, "Invalid OPN format"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RiderRegistrationData = z.infer<typeof riderRegistrationSchema>;
export type BioData = z.infer<typeof bioDataSchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type VehicleInfo = z.infer<typeof vehicleInfoSchema>;
export type ComplianceData = z.infer<typeof complianceSchema>;

// Backward compatibility
export type RiderFormValues = RiderRegistrationData;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate rider registration data
 */
export const validateRiderRegistration = async (data: unknown) => {
  try {
    return await riderRegistrationSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      };
    }
    throw error;
  }
};

/**
 * Generate OPN code from registration data
 */
export const generateOPN = (data: {
  districtMunicipality: string;
  vehicleCategory: string;
}): string => {
  const districtCode = DISTRICT_CODES[data.districtMunicipality] || "XX";
  const categoryCode = CATEGORY_CODES[data.vehicleCategory] || "X";
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `OPN-${districtCode}${categoryCode}${timestamp}${randomSuffix}`;
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return phoneRegex.test(phone);
};

/**
 * Validate Ghana Card number
 */
export const isValidGhanaCard = (card: string): boolean => {
  return ghanaCardRegex.test(card);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};