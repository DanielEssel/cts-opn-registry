import { z } from "zod";

// ============================================================================
// REGEX PATTERNS
// ============================================================================

// Ghana Card Number validation pattern: GHA-XXXXXXXXX-X
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

// Phone number validation (10 digits)
const phoneRegex = /^\d{10}$/;

// Voter ID validation (10 digits)
const voterIdRegex = /^\d{10}$/;

// Passport validation (letter + digits, 7-9 chars)
const passportRegex = /^[A-Z]\d{6,8}$/;

// Driver's License validation: FAT-00000000-00000 (3 letters - 8 digits - 5 digits)
const driversLicenseRegex = /^[A-Z]{3}-\d{8}-\d{5}$/;

// ============================================================================
// DISTRICT CODES
// ============================================================================

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

// ============================================================================
// VEHICLE CATEGORY CODES
// ============================================================================

export const CATEGORY_CODES: Record<string, string> = {
  "Pragya": "P",
  "Motorbike/Okada": "M",
  "Tricycle/Aboboyaa": "T",
};

// ============================================================================
// BIO DATA SCHEMA
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

  idType: z.enum(["GHANA_CARD", "VOTERS_ID", "PASSPORT"], {
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

  // ========================================================================
  // GHANA CARD VALIDATION
  // ========================================================================
  if (data.idType === "GHANA_CARD") {
    if (!ghanaCardRegex.test(data.idNumber)) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Ghana Card format. Expected: GHA-712014412-4",
        code: z.ZodIssueCode.custom,
      });
    }
  }

  // ========================================================================
  // VOTER ID VALIDATION
  // ========================================================================
  if (data.idType === "VOTERS_ID") {
    if (!voterIdRegex.test(data.idNumber)) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Voter ID format. Expected: 4393000029 (10 digits)",
        code: z.ZodIssueCode.custom,
      });
    }
  }

  // ========================================================================
  // PASSPORT VALIDATION
  // ========================================================================
  if (data.idType === "PASSPORT") {
    if (!passportRegex.test(data.idNumber)) {
      ctx.addIssue({
        path: ["idNumber"],
        message: "Invalid Passport format. Expected: G2282683 (1 letter + 6-8 digits)",
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

// ============================================================================
// LOCATION SCHEMA
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
// VEHICLE INFO SCHEMA
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
// COMPLIANCE SCHEMA
// ============================================================================

export const complianceSchema = z.object({
  driversLicenseNumber: z
    .string()
    .min(16, "Driver's License number is required")
    .max(16, "Driver's License must be exactly 16 characters"),

  licenseExpiryDate: z.string().refine((date) => {
    const expiry = new Date(date);
    const today = new Date();
    return expiry > today;
  }, "License must not be expired"),

  nextOfKinName: z
    .string()
    .min(3, "Next of kin name must be at least 3 characters")
    .max(100, "Next of kin name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  nextOfKinContact: z
    .string()
    .regex(phoneRegex, "Next of kin contact must be exactly 10 digits"),

  passportPhoto: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Photo must be less than 5MB"
    )
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Photo must be JPEG or PNG"
    ),
}).superRefine((data, ctx) => {

  // ========================================================================
  // DRIVER'S LICENSE VALIDATION
  // ========================================================================
  if (!driversLicenseRegex.test(data.driversLicenseNumber)) {
    ctx.addIssue({
      path: ["driversLicenseNumber"],
      message: "Invalid Driver's License format. Expected: FAT-12345678-00001",
      code: z.ZodIssueCode.custom,
    });
  }
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