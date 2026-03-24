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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface BioDataStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

// ID Validation Rules - Frontend Display with CORRECT formats
const ID_VALIDATION_RULES = {
  GHANA_CARD: {
    label: "Ghana Card",
    placeholder: "712014412-4",
    displayPlaceholder: "GHA-712014412-4",
    pattern: /^GHA-\d{9}-\d$/,
    example: "GHA-712014412-4",
    format: "GHA-XXXXXXXXX-X",
    digitCount: "9 digits + 1 check digit",
    minLength: 15, // GHA-XXXXXXXXX-X
    maxLength: 15,
    help: "Ghana Card: 9 digits, then 1 check digit (auto-formatted with GHA- and hyphens)",
    autoFormat: true,
  },
  VOTERS_ID: {
    label: "Voter's ID",
    placeholder: "4393000029",
    displayPlaceholder: "4393000029",
    pattern: /^\d{10}$/,
    example: "4393000029",
    format: "10 digits",
    digitCount: "10 digits",
    minLength: 10,
    maxLength: 10,
    help: "Voter ID: 10 digits only",
    autoFormat: false,
  },
  PASSPORT: {
    label: "Passport",
    placeholder: "G2282683",
    displayPlaceholder: "G2282683",
    pattern: /^[A-Z]\d{6,8}$/,
    example: "G2282683",
    format: "1 letter + 6-8 digits",
    digitCount: "6-8 digits",
    minLength: 7,
    maxLength: 9,
    help: "Passport: 1 uppercase letter followed by 6-8 digits",
    autoFormat: false,
  },
};

type IDType = keyof typeof ID_VALIDATION_RULES;

// Helper function to format Ghana Card with auto GHA- and hyphens
const formatGhanaCard = (value: string): string => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, "");

  // If more than 10 digits, truncate
  const truncated = digitsOnly.slice(0, 10);

  // Format as GHA-XXXXXXXXX-X
  if (truncated.length <= 9) {
    if (truncated.length === 0) return "";
    return `GHA-${truncated}`;
  } else {
    return `GHA-${truncated.slice(0, 9)}-${truncated.slice(9)}`;
  }
};

// Frontend validation for real-time feedback
const validateIDFormat = (
  idNumber: string,
  idType: string
): { valid: boolean; message: string } => {
  if (!idType || !idNumber) {
    return { valid: false, message: "Select ID type and enter number" };
  }

  const rule = ID_VALIDATION_RULES[idType as IDType];
  if (!rule) {
    return { valid: false, message: "Invalid ID type" };
  }

  // Check length
  if (idNumber.length < rule.minLength || idNumber.length > rule.maxLength) {
    return {
      valid: false,
      message: `${rule.label} must be ${rule.format}`,
    };
  }

  // Check pattern
  if (!rule.pattern.test(idNumber)) {
    return {
      valid: false,
      message: `Invalid ${rule.label} format. Expected: ${rule.example}`,
    };
  }

  return { valid: true, message: `Valid ${rule.label}` };
};

export function BioDataStep({ form }: BioDataStepProps) {
  const idType = form.watch("idType");
  const idNumber = form.watch("idNumber");

  const idValidation = idNumber && idType 
    ? validateIDFormat(idNumber, idType)
    : null;

  const currentIDRule = idType ? ID_VALIDATION_RULES[idType as IDType] : null;
  const isValid = idValidation?.valid;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Bio Data</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please provide your personal information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe Mensah"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="0241234567"
                  {...field}
                  maxLength={10}
                  className="h-11"
                  inputMode="numeric"
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">10-digit number</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID Type */}
        <FormField
          control={form.control}
          name="idType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Type *</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GHANA_CARD">
                    Ghana Card
                  </SelectItem>
                  <SelectItem value="VOTERS_ID">
                    Voter's ID
                  </SelectItem>
                  <SelectItem value="PASSPORT">
                    Passport
                  </SelectItem>
                </SelectContent>
              </Select>
              {currentIDRule && (
                <p className="text-xs text-blue-600 mt-2">
                  Format: {currentIDRule.format}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID Number - Dynamic based on ID Type */}
        {idType && (
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => {
              const rule = ID_VALIDATION_RULES[idType as IDType];

              return (
                <FormItem>
                  <FormLabel>
                    {rule?.label} *
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder={rule?.displayPlaceholder}
                        {...field}
                        className={`h-11 ${
                          idType === "GHANA_CARD" ? "font-mono tracking-widest" : ""
                        } ${
                          idNumber && !isValid
                            ? "border-green-500 focus:ring-red-500"
                            : idNumber && isValid
                            ? "border-green-500 focus:ring-green-500"
                            : ""
                        }`}
                        maxLength={rule?.maxLength}
                        onChange={(e) => {
                          let value = e.target.value.toUpperCase();

                          // Auto-format Ghana Card
                          if (idType === "GHANA_CARD") {
                            value = formatGhanaCard(value);
                          }

                          field.onChange(value);
                        }}
                        disabled={!idType}
                      />
                    </FormControl>

                    {/* Validation Indicator */}
                    {idNumber && (
                      <div className="absolute right-3 top-3">
                        {isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Help Text with Ghana Card specifics */}
                  <p className="text-xs text-gray-500 mt-2">
                    {idType === "GHANA_CARD" ? (
                      <>
                        {rule?.help}
                        <br />
                        <span className="text-blue-600 font-semibold mt-1 block">
                          ℹ️ Type only the digits, GHA- and hyphens will be added automatically
                        </span>
                      </>
                    ) : (
                      rule?.help
                    )}
                  </p>

                  {/* Validation Message */}
                  {idNumber && idValidation && (
                    <div
                      className={`text-xs mt-2 p-2 rounded flex items-start gap-2 ${
                        isValid
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {isValid ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{idValidation.message}</span>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth *</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="h-11" />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">Must be 18+ years old</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">👨 Male</SelectItem>
                  <SelectItem value="Female">👩 Female</SelectItem>
                  <SelectItem value="Other">⚧ Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ID Type Info Box */}
      {currentIDRule && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          isValid && idNumber
            ? "bg-green-50 border-green-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <h4 className={`font-semibold mb-2 ${
            isValid && idNumber
              ? "text-green-900"
              : "text-blue-900"
          }`}>
            {currentIDRule.label} Information
          </h4>
          <ul className={`text-sm space-y-1 ${
            isValid && idNumber
              ? "text-green-800"
              : "text-blue-800"
          }`}>
            <li>
              ✓ Format: 
              <code className={`px-2 py-1 rounded ml-2 font-mono font-bold ${
                isValid && idNumber
                  ? "bg-green-100"
                  : "bg-blue-100"
              }`}>
                {currentIDRule.example}
              </code>
            </li>
            <li>✓ Length: {currentIDRule.digitCount}</li>
            <li>✓ {currentIDRule.help}</li>
            {currentIDRule.autoFormat && (
              <li className={`font-semibold mt-2 ${
                isValid && idNumber
                  ? "text-green-700"
                  : "text-blue-600"
              }`}>
                ⚡ Auto-formatted - just type the digits!
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}