"use client";

import { UseFormReturn } from "react-hook-form";
import { RiderRegistrationData } from "@/app/lib/validations";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

const DISTRICTS = [
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
];

export function LocationStep({ form }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
        <p className="text-sm text-gray-500 mt-1">
          Greater Accra Region Pilot Program
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value="Greater Accra"
                  readOnly
                  disabled
                  className="h-11 bg-gray-50"
                />
              </FormControl>
              <FormDescription>
                Currently piloting in Greater Accra only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="districtMunicipality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District / Municipality *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="residentialTown"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Residential Town *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Dansoman, Teshie, Nungua"
                  {...field}
                  className="h-11"
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