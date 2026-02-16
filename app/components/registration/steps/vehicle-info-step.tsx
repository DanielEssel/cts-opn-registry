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
import { Bike, Car } from "lucide-react";

interface VehicleInfoStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

const VEHICLE_CATEGORIES = [
  { value: "Pragya", label: "Pragya", icon: Car },
  { value: "Motorbike/Okada", label: "Motorbike/Okada", icon: Bike },
  { value: "Tricycle/Aboboyaa", label: "Tricycle/Aboboyaa", icon: Car },
];

export function VehicleInfoStep({ form }: VehicleInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide details about your vehicle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="vehicleCategory"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Vehicle Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center">
                        <category.icon className="w-4 h-4 mr-2" />
                        {category.label}
                      </div>
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
          name="plateNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plate Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="GR-1234-20"
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
          name="chassisNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chassis Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="ABC123XYZ456789"
                  {...field}
                  className="h-11 uppercase"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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