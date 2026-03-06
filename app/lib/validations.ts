import { z } from "zod";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";
// ============================================================================
// REGEX PATTERNS
// ============================================================================

const ghanaCardRegex = /^GHA-\d{9}-\d$/;
const phoneRegex = /^\d{10}$/;
const voterIdRegex = /^\d{10}$/;
const passportRegex = /^[A-Z]\d{6,8}$/;
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

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
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
      regex: ghanaCardRegex,
      message: "Invalid Ghana Card format. Expected: GHA-712014412-4",
    },
    VOTERS_ID: {
      regex: voterIdRegex,
      message: "Invalid Voter ID format. Expected: 4393000029 (10 digits)",
    },
    PASSPORT: {
      regex: passportRegex,
      message:
        "Invalid Passport format. Expected: G2282683 (1 letter + 6-8 digits)",
    },
  };

  const validator = validators[data.idType];

  if (!validator.regex.test(idNumber)) {
    ctx.addIssue({
      path: ["idNumber"],
      message: validator.message,
      code: z.ZodIssueCode.custom,
    });
  }
});

 

// ============================================================================
// LOCATION SCHEMA
// ============================================================================

export const locationSchema = z.object({
  //Locked to Greater Accra
  region: z.literal("Greater Accra", {
  message: "Region must be Greater Accra",
}),


  // region: z.string().min(1, "Region is required"), //for all region

  districtMunicipality: z.enum(
    Object.keys(DISTRICT_CODES) as [string, ...string[]],
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

export const vehicleInfoSchema = z.object({
  vehicleCategory: z.enum(
    Object.keys(CATEGORY_CODES) as [string, ...string[]],
    { message: "Please select a valid vehicle category" }
  ),

  plateNumber: z
    .string()
    .min(2, "Plate number is required")
    .max(20, "Plate number is too long")
    .regex(/^[A-Z0-9\-]+$/i, "Invalid plate number format"),

  chassisNumber: z
    .string()
    .min(10, "Chassis number must be at least 10 characters")
    .max(30, "Chassis number is too long")
    .regex(/^[A-Z0-9]+$/i, "Chassis number must be alphanumeric"),
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
    .regex(/^[A-Z0-9\-]+$/, "Invalid RIN format"),
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