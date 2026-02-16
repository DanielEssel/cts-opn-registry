import { z } from "zod";

// Ghana Card Number validation pattern: GHA-XXXXXXXXX-X
const ghanaCardRegex = /^GHA-\d{9}-\d$/;

// Phone number validation (10 digits)
const phoneRegex = /^\d{10}$/;

// District codes mapping for OPN generation
export const DISTRICT_CODES: Record<string, string> = {
  "Accra Metro": "AM",
  "Krowor": "KR",
  "Madina": "MD",
  "Ashaiman": "AS",
  "Tema Metro": "TM",
  "Ga South": "GS",
  "Ga West": "GW",
  "Ga East": "GE",
  "Ga Central": "GC",
  "Ledzokuku": "LD",
  "Ablekuma North": "AN",
  "Ablekuma Central": "AC",
  "Ablekuma West": "AW",
};

// Vehicle category codes for OPN generation
export const CATEGORY_CODES: Record<string, string> = {
  "Pragya": "P",
  "Motorbike/Okada": "M",
  "Tricycle/Aboboyaa": "T",
};

// Step 1: Bio Data Schema
export const bioDataSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Phone number must be exactly 10 digits"),
  ghanaCardNumber: z
    .string()
    .regex(ghanaCardRegex, "Invalid Ghana Card format (GHA-XXXXXXXXX-X)"),
  dateOfBirth: z
    .string()
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 100;
    }, "Rider must be at least 18 years old"),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender",
  }),
});

// Step 2: Location Schema
export const locationSchema = z.object({
  region: z.literal("Greater Accra"),
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
      message: "Please select a district",
    }
  ),
  residentialTown: z
    .string()
    .min(2, "Town name must be at least 2 characters")
    .max(50, "Town name is too long"),
});

// Step 3: Vehicle Info Schema
export const vehicleInfoSchema = z.object({
  vehicleCategory: z.enum(["Pragya", "Motorbike/Okada", "Tricycle/Aboboyaa"], {
    message: "Please select a vehicle category",
  }),
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

// Step 4: Compliance Schema
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
    .or(z.string().url().optional()),
});

// Combined Registration Schema
export const riderRegistrationSchema = z.object({
  ...bioDataSchema.shape,
  ...locationSchema.shape,
  ...vehicleInfoSchema.shape,
  ...complianceSchema.shape,
});

// BACKWARD COMPATIBILITY: Export as riderSchema for existing code
export const riderSchema = riderRegistrationSchema;

// Lookup schemas
export const ghanaCardLookupSchema = z.object({
  ghanaCardNumber: z
    .string()
    .regex(ghanaCardRegex, "Invalid Ghana Card format (GHA-XXXXXXXXX-X)"),
});

export const phoneLookupSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, "Phone number must be exactly 10 digits"),
});

// Type exports
export type RiderRegistrationData = z.infer<typeof riderRegistrationSchema>;
export type BioData = z.infer<typeof bioDataSchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type VehicleInfo = z.infer<typeof vehicleInfoSchema>;
export type ComplianceData = z.infer<typeof complianceSchema>;

// BACKWARD COMPATIBILITY: Export as RiderFormValues for existing code
export type RiderFormValues = RiderRegistrationData;