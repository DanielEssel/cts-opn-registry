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

interface ComplianceStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

const DL_VALIDATION_RULES = {
  pattern: /^[A-Z]{3}-\d{8}-\d{5}$/,
  example: "FAT-12345678-00001",
  help: "3 letters, 8 digits, 5 digits (e.g., FAT-12345678-00001)",
  totalChars: 18,   // 3 + 1 + 8 + 1 + 5 (with hyphens)
  actualDigits: 16, // 3 + 8 + 5 (no hyphens)
};

const validateDLFormat = (dl: string): { valid: boolean; message: string } => {
  if (!dl) return { valid: false, message: "Enter Driver's License number" };
  if (dl.length !== DL_VALIDATION_RULES.totalChars)
    return { valid: false, message: `${dl.length}/${DL_VALIDATION_RULES.totalChars} characters` };
  if (!DL_VALIDATION_RULES.pattern.test(dl))
    return { valid: false, message: `Invalid format. Expected: ${DL_VALIDATION_RULES.example}` };
  return { valid: true, message: "Valid Driver's License" };
};

// Minimum date = today (license must not be expired)
const getTodayString = () => new Date().toISOString().split("T")[0];

export function ComplianceStep({ form }: ComplianceStepProps) {
  const dlNumber = form.watch("driversLicenseNumber");
  const dlValidation = dlNumber ? validateDLFormat(dlNumber) : null;
  const isDLValid = dlValidation?.valid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">✓ Compliance & Documents</h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide driver's license, next of kin information, and capture a passport photo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── DRIVER'S LICENSE NUMBER ── */}
        <FormField
          control={form.control}
          name="driversLicenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Driver's License Number *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder={DL_VALIDATION_RULES.example}
                    {...field}
                    className={`h-11 uppercase font-mono tracking-wider pr-10 ${
                      dlNumber && !isDLValid ? "border-red-500" : dlNumber && isDLValid ? "border-green-500" : ""
                    }`}
                    maxLength={DL_VALIDATION_RULES.totalChars}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      if (clean.length > DL_VALIDATION_RULES.actualDigits) return;
                      let formatted = clean.slice(0, 3);
                      if (clean.length > 3)  formatted += "-" + clean.slice(3, 11);
                      if (clean.length > 11) formatted += "-" + clean.slice(11, 16);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                {dlNumber && (
                  <div className="absolute right-3 top-3">
                    {isDLValid
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{DL_VALIDATION_RULES.help}</p>
              {dlNumber && dlValidation && (
                <div className={`text-xs mt-2 p-2 rounded flex items-start gap-2 ${
                  isDLValid ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {isDLValid ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <span>{dlValidation.message}</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── LICENSE EXPIRY DATE ── */}
        <FormField
          control={form.control}
          name="licenseExpiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">License Expiry Date *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={getTodayString()}
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── NEXT OF KIN NAME ── */}
        <FormField
          control={form.control}
          name="nextOfKinName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Next of Kin Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Full name of next of kin"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">At least 3 characters</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── NEXT OF KIN CONTACT ── */}
        <FormField
          control={form.control}
          name="nextOfKinContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Next of Kin Contact *</FormLabel>
              <FormControl>
                <Input
                  placeholder="0241234567"
                  {...field}
                  maxLength={10}
                  className="h-11"
                  inputMode="numeric"
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">10-digit phone number</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── PASSPORT PHOTO ── */}
        <FormField
          control={form.control}
          name="passportPhoto"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-semibold">Passport Photo *</FormLabel>
              <div className="max-w-xs">
                <FormControl>
                  <PhotoUpload
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.passportPhoto?.message}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Format Guide */}
      <div className={`p-4 rounded-lg border-2 transition-colors ${
        isDLValid && dlNumber ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
      }`}>
        <h4 className={`font-semibold mb-2 ${isDLValid && dlNumber ? "text-green-900" : "text-blue-900"}`}>
          Driver's License Format Guide
        </h4>
        <ul className={`text-sm space-y-1 ${isDLValid && dlNumber ? "text-green-800" : "text-blue-800"}`}>
          <li>✓ Pattern: 3 letters – 8 digits – 5 digits</li>
          <li>✓ Type {DL_VALIDATION_RULES.actualDigits} characters — hyphens are added automatically</li>
          <li className="pt-1 font-semibold">💡 Example: {DL_VALIDATION_RULES.example}</li>
        </ul>
      </div>
    </div>
  );
}