"use client";

import { UseFormReturn } from "react-hook-form";
import { RiderRegistrationData } from "@/app/lib/validations";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhotoUpload } from "@/components/photo-upload";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

// ============================================================================
// DRIVER'S LICENSE VALIDATION RULES
// ============================================================================

const DL_VALIDATION_RULES = {
  pattern: /^[A-Z]{3}-\d{8}-\d{5}$/,
  example: "FAT-12345678-00001",
  format: "AAA-XXXXXXXX-XXXXX",
  help: "3 letters, 8 digits, 5 digits (e.g., FAT-12345678-00001)",
  totalChars: 18, // Including hyphens
  actualDigits: 16, // 3 letters + 8 digits + 5 digits
};

// ============================================================================
// DRIVER'S LICENSE VALIDATION FUNCTION
// ============================================================================

/**
 * Frontend validation for Driver's License format
 */
const validateDLFormat = (
  dlNumber: string
): { valid: boolean; message: string } => {
  if (!dlNumber) {
    return { valid: false, message: "Enter Driver's License number" };
  }

  if (dlNumber.length !== DL_VALIDATION_RULES.totalChars) {
    return {
      valid: false,
      message: `Driver's License must be ${DL_VALIDATION_RULES.totalChars} characters (${dlNumber.length}/${DL_VALIDATION_RULES.totalChars})`,
    };
  }

  if (!DL_VALIDATION_RULES.pattern.test(dlNumber)) {
    return {
      valid: false,
      message: `Invalid format. Expected: ${DL_VALIDATION_RULES.example}`,
    };
  }

  return { valid: true, message: "✓ Valid Driver's License" };
};

// ============================================================================
// COMPLIANCE STEP COMPONENT
// ============================================================================

export function ComplianceStep({ form }: ComplianceStepProps) {
  const dlNumber = form.watch("driversLicenseNumber");
  const nextOfKinName = form.watch("nextOfKinName");

  const dlValidation = dlNumber ? validateDLFormat(dlNumber) : null;
  const isDLValid = dlValidation?.valid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          ✓ Compliance & Documents
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide driver's license, next of kin information, and capture a
          passport photo
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ====================================================================
            DRIVER'S LICENSE NUMBER
            ==================================================================== */}
        <FormField
          control={form.control}
          name="driversLicenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">
                Driver's License Number *
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder={DL_VALIDATION_RULES.example}
                    {...field}
                    className={`h-11 uppercase font-mono tracking-wider ${
                      dlNumber && !isDLValid
                        ? "border-red-500 focus:ring-red-500"
                        : dlNumber && isDLValid
                        ? "border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                    maxLength={DL_VALIDATION_RULES.totalChars}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase();

                      // Remove all hyphens to count actual input
                      const cleanedInput = value.replace(/[^A-Z0-9]/g, "");

                      // Limit to actual digits/letters only (14 chars)
                      if (cleanedInput.length > DL_VALIDATION_RULES.actualDigits) {
                        // Don't add more characters
                        return;
                      }

                      // Build the formatted string: AAA-XXXXXXXX-XXXXX
                      let formatted = "";

                      // First 3 characters (letters)
                      if (cleanedInput.length > 0) {
                        formatted = cleanedInput.slice(0, 3);
                      }

                      // Add first hyphen after 3 letters
                      if (cleanedInput.length > 3) {
                        formatted += "-";
                      }

                      // Next 8 digits
                      if (cleanedInput.length > 3) {
                        formatted += cleanedInput.slice(3, 11);
                      }

                      // Add second hyphen after 8 digits
                      if (cleanedInput.length > 11) {
                        formatted += "-";
                      }

                      // Last 5 digits
                      if (cleanedInput.length > 11) {
                        formatted += cleanedInput.slice(11, 16);
                      }

                      field.onChange(formatted);
                    }}
                  />
                </FormControl>

                {/* Validation Indicator */}
                {dlNumber && (
                  <div className="absolute right-3 top-3">
                    {isDLValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 mt-2">
                {DL_VALIDATION_RULES.help}
              </p>

              {/* Validation Message */}
              {dlNumber && dlValidation && (
                <div
                  className={`text-xs mt-2 p-2 rounded flex items-start gap-2 ${
                    isDLValid
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {isDLValid ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{dlValidation.message}</span>
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        {/* ====================================================================
            NEXT OF KIN CONTACT
            ==================================================================== */}
        <FormField
          control={form.control}
          name="nextOfKinContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">
                Next of Kin Contact *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0241234567"
                  {...field}
                  maxLength={10}
                  className="h-11"
                  inputMode="numeric"
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                10-digit phone number
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ====================================================================
            PASSPORT PHOTO - WITH CAMERA CAPTURE
            ==================================================================== */}
        <FormField
          control={form.control}
          name="passportPhoto"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormControl>
                <PhotoUpload
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.passportPhoto?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

            
      {/* ========================================================================
          NEXT OF KIN INFO BOX
          ======================================================================== */}
      {nextOfKinName && (
        <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
          <h4 className="font-semibold mb-2 text-blue-900">
            Next of Kin Information
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              ✓ Name: <span className="font-semibold">{nextOfKinName}</span>
            </p>
            <p className="text-xs text-blue-600 pt-2">
              This person will be contacted in case of emergency
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
