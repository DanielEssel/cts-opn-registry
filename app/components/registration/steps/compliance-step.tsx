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
import { PhotoUpload } from "../photo-upload";

interface ComplianceStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

export function ComplianceStep({ form }: ComplianceStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Compliance & Documents</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload required documents and provide compliance information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="driversLicenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Driver&apos;s License Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="DL123456"
                  {...field}
                  className="h-11 uppercase"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseExpiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Expiry Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextOfKinContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next of Kin Contact *</FormLabel>
              <FormControl>
                <Input
                  placeholder="0241234567"
                  {...field}
                  maxLength={10}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
    </div>
  );
}