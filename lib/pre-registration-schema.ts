import { z } from "zod";

// ─── Pre-registration schema (public-facing, subset of full RIN schema) ───────
// Intentionally does NOT include: plate number, chassis, license, compliance docs
// Those are collected later by the operator at the RIN registration stage.

export const preRegistrationSchema = z.object({
  // Bio
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Name too long"),

  phoneNumber: z
    .string()
    .regex(/^0[2357][0-9]{8}$/, "Enter a valid Ghana phone number (e.g. 0244000000)"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const dob = new Date(val);
      const age = new Date().getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 70;
    }, "Rider must be between 18 and 70 years old"),

  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Please select a gender",
  }),

  // ID
  idType: z.enum(["Ghana Card", "Voter ID", "NHIS Card", "Passport"], {
    required_error: "Please select an ID type",
  }),

  idNumber: z
    .string()
    .min(5, "ID number is required")
    .max(30, "ID number too long"),

  // Location
  region: z.string().min(1, "Please select a region"),

  districtMunicipality: z
    .string()
    .min(2, "District or municipality is required"),

  residentialTown: z
    .string()
    .min(2, "Residential town is required"),

  // Vehicle
  vehicleCategory: z.enum(["Motorbike", "Tricycle", "Pragia"], {
    required_error: "Please select a vehicle category",
  }),

  // Next of kin
  nextOfKinName: z
    .string()
    .min(3, "Next of kin name is required"),

  nextOfKinContact: z
    .string()
    .regex(/^0[2357][0-9]{8}$/, "Enter a valid Ghana phone number"),
});

export type PreRegistrationData = z.infer<typeof preRegistrationSchema>;

// Step-level schemas for per-step validation (mirrors RIN engine pattern)
export const preBioSchema = preRegistrationSchema.pick({
  fullName: true,
  phoneNumber: true,
  dateOfBirth: true,
  gender: true,
});

export const preIdSchema = preRegistrationSchema.pick({
  idType: true,
  idNumber: true,
});

export const preLocationSchema = preRegistrationSchema.pick({
  region: true,
  districtMunicipality: true,
  residentialTown: true,
});

export const preVehicleSchema = preRegistrationSchema.pick({
  vehicleCategory: true,
});

export const preKinSchema = preRegistrationSchema.pick({
  nextOfKinName: true,
  nextOfKinContact: true,
});