import { z } from "zod";

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const ghanaCardRegex      = /^GHA-\d{9}-\d$/;
const phoneRegex          = /^\d{10}$/;
const voterIdRegex        = /^\d{10}$/;
const passportRegex       = /^[A-Z]\d{6,8}$/;
const driversLicenseRegex = /^[A-Z]{3}-\d{8}-\d{5}$/;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateAge = (dateString: string) => {
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const normalizeUpper = (value: string) => value.trim().toUpperCase();

// ============================================================================
// BIO DATA SCHEMA
// ============================================================================

export const bioDataSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, "Phone number must be exactly 10 digits"),

  idType: z.enum(["GHANA_CARD", "VOTERS_ID", "PASSPORT"]),

  idNumber: z
    .string()
    .trim()
    .min(5, "ID number is required"),

  dateOfBirth: z
    .string()
    .refine((date) => {
      const age = calculateAge(date);
      return age !== null && age >= 18 && age <= 100;
    }, "Rider must be between 18 and 100 years old"),

  gender: z.enum(["Male", "Female", "Other"]),

}).superRefine((data, ctx) => {
  const idNumber = normalizeUpper(data.idNumber);
  const validators: Record<string, { regex: RegExp; message: string }> = {
    GHANA_CARD: {
      regex:   ghanaCardRegex,
      message: "Invalid Ghana Card format. Expected: GHA-712014412-4",
    },
    VOTERS_ID: {
      regex:   voterIdRegex,
      message: "Invalid Voter ID format. Expected: 4393000029 (10 digits)",
    },
    PASSPORT: {
      regex:   passportRegex,
      message: "Invalid Passport format. Expected: G2282683 (1 letter + 6-8 digits)",
    },
  };
  const validator = validators[data.idType];
  if (validator && !validator.regex.test(idNumber)) {
    ctx.addIssue({
      path:    ["idNumber"],
      message: validator.message,
      code:    z.ZodIssueCode.custom,
    });
  }
});

// ============================================================================
// LOCATION SCHEMA
// ============================================================================

export const locationSchema = z.object({
  // Locked to Greater Accra for pilot phase
  region: z.literal("Greater Accra", {
    message: "Region must be Greater Accra",
  }),

  // Must match DISTRICT_CODES keys in rin-constants.ts exactly
  districtMunicipality: z.enum(
    [
      "Accra Metropolitan",
      "Tema Metropolitan",
      "Ga East Municipal",
      "Ga West Municipal",
      "Ga Central Municipal",
      "Ga South Municipal",
      "Adenta Municipal",
      "Ledzokuku Municipal",
      "Krowor Municipal",
      "Ningo Prampram",
      "Shai Osudoku",
      "Ayawaso East Municipal",
      "Ayawaso West Municipal",
      "Ayawaso Central Municipal",
      "Ablekuma North Municipal",
      "Ablekuma Central Municipal",
      "Ablekuma West Municipal",
      "La Nkwantanang-Madina",
      "La Dade Kotopon Municipal",
      "Okaikwei North Municipal",
      "Weija Gbawe Municipal",
      "Korle Klottey Municipal",
      "Ashaiman Municipal",
      "Kpone Katamanso",
    ],
    { message: "Please select a valid district" }
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

// Must match CATEGORY_CODES keys in rin-constants.ts exactly
export const vehicleInfoSchema = z.object({
  vehicleCategory: z.enum(
    ["Motorbike", "Tricycle", "Pragya", "Quadricycle"],
    { message: "Please select a valid vehicle category" }
  ),

  plateNumber: z
    .string()
    .min(2, "Plate number is required")
    .max(20, "Plate number is too long")
    .regex(/^[A-Z0-9\-]+$/i, "Invalid plate number format (letters, numbers, hyphens only)"),

  chassisNumber: z
    .string()
    .min(10, "Chassis number must be at least 10 characters")
    .max(30, "Chassis number is too long")
    .regex(/^[A-Z0-9]+$/i, "Chassis number must be alphanumeric"),
});

// ============================================================================
// COMPLIANCE SCHEMA
// ============================================================================

export const complianceSchema = z.object({
  driversLicenseNumber: z
    .string()
    .trim()
    .transform(normalizeUpper)
    .refine(
      (value) => driversLicenseRegex.test(value),
      "Invalid Driver's License format. Expected: FAT-12345678-00001"
    ),

  licenseExpiryDate: z.string().refine((date) => {
    const expiry = new Date(date);
    if (isNaN(expiry.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry > today;
  }, "License must not be expired"),

  nextOfKinName: z
    .string()
    .trim()
    .min(3, "Next of kin name must be at least 3 characters")
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  nextOfKinContact: z
    .string()
    .trim()
    .regex(phoneRegex, "Next of kin contact must be exactly 10 digits"),

  passportPhoto: z
    .any()
    .refine((file) => file instanceof File, "Please upload a passport photo")
    .refine(
      (file) => !(file instanceof File) || file.size <= 5 * 1024 * 1024,
      "Photo must be less than 5MB"
    )
    .refine(
      (file) => !(file instanceof File) || ["image/jpeg", "image/png"].includes(file.type),
      "Photo must be JPEG or PNG"
    )
    .optional(),
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

export const RINLookupSchema = z.object({
  RIN: z
    .string()
    .regex(/^[A-Z]{2}[A-Z]-\d{4}-[A-Z]{2}\d{4}$/, "Invalid RIN format. Expected: GAT-0001-AM0326"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RiderRegistrationData = z.infer<typeof riderRegistrationSchema>;
export type BioData               = z.infer<typeof bioDataSchema>;
export type LocationData          = z.infer<typeof locationSchema>;
export type VehicleInfo           = z.infer<typeof vehicleInfoSchema>;
export type ComplianceData        = z.infer<typeof complianceSchema>;

// Backward compatibility
export type RiderFormValues = RiderRegistrationData;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const validateRiderRegistration = async (data: unknown) => {
  try {
    return await riderRegistrationSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    throw error;
  }
};