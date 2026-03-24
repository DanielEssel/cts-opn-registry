import { z } from "zod";
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

const DISTRICTS     = Object.keys(DISTRICT_CODES) as [string, ...string[]];
const VEHICLE_TYPES = Object.keys(CATEGORY_CODES) as [string, ...string[]];
const GENDERS       = ["Male", "Female", "Other"]             as const;
const ID_TYPES      = ["GHANA_CARD", "VOTERS_ID", "PASSPORT"] as const;

const phoneField = (msg = "Phone number must be exactly 10 digits") =>
  z.string().trim().regex(/^\d{10}$/, msg);

const nameField = (label: string) =>
  z.string().trim()
    .min(3, `${label} must be at least 3 characters`)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, `${label} must contain only letters and spaces`);

function calculateAge(dateString: string): number | null {
  const dob = new Date(dateString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const ID_VALIDATORS: Record<string, { regex: RegExp; message: string }> = {
  GHANA_CARD: { regex: /^GHA-\d{9}-\d$/,  message: "Invalid Ghana Card format. Expected: GHA-712014412-4" },
  VOTERS_ID:  { regex: /^\d{10}$/,         message: "Invalid Voter ID format. Expected: 4393000029 (10 digits)" },
  PASSPORT:   { regex: /^[A-Z]\d{6,8}$/,  message: "Invalid Passport format. Expected: G2282683 (1 letter + 6–8 digits)" },
};

// ─── Base object schema (no superRefine — required for .pick() to work) ───────

const preRegistrationBaseSchema = z.object({
  fullName:             nameField("Full name"),
  phoneNumber:          phoneField(),
  dateOfBirth:          z.string().refine(
                          (d) => { const age = calculateAge(d); return age !== null && age >= 18 && age <= 100; },
                          "Rider must be between 18 and 100 years old"
                        ),
  gender:               z.enum(GENDERS),
  idType:               z.enum(ID_TYPES),
  idNumber:             z.string().trim().min(5, "ID number is required").max(30, "ID number too long"),
  region:               z.literal("Greater Accra", { message: "Region must be Greater Accra" }),
  districtMunicipality: z.enum(DISTRICTS, { message: "Please select a valid district" }),
  residentialTown:      z.string()
                          .min(2, "Town name must be at least 2 characters")
                          .max(50, "Town name is too long")
                          .regex(/^[a-zA-Z\s\-]+$/i, "Town name must contain only letters and hyphens"),
  vehicleCategory:      z.enum(VEHICLE_TYPES, { message: "Please select a valid vehicle category" }),
  nextOfKinName:        nameField("Next of kin name"),
  nextOfKinContact:     phoneField("Next of kin contact must be exactly 10 digits"),
});

// ─── Step schemas (picked from base — no superRefine present, so this works) ──

export const preBioSchema      = preRegistrationBaseSchema.pick({ fullName: true, phoneNumber: true, dateOfBirth: true, gender: true });
export const preIdSchema       = preRegistrationBaseSchema.pick({ idType: true, idNumber: true });
export const preLocationSchema = preRegistrationBaseSchema.pick({ region: true, districtMunicipality: true, residentialTown: true });
export const preVehicleSchema  = preRegistrationBaseSchema.pick({ vehicleCategory: true });
export const preKinSchema      = preRegistrationBaseSchema.pick({ nextOfKinName: true, nextOfKinContact: true });

// ─── Full schema (superRefine applied on top for cross-field ID validation) ───

export const preRegistrationSchema = preRegistrationBaseSchema.superRefine(
  ({ idType, idNumber }, ctx) => {
    const validator = ID_VALIDATORS[idType];
    if (validator && !validator.regex.test(idNumber.trim().toUpperCase())) {
      ctx.addIssue({ path: ["idNumber"], message: validator.message, code: z.ZodIssueCode.custom });
    }
  }
);

export type PreRegistrationData = z.infer<typeof preRegistrationSchema>;