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
import { Bike, Zap, Car } from "lucide-react";

interface VehicleInfoStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

// Vehicle categories - matching schema exactly
const VEHICLE_CATEGORIES = [
  { 
    value: "Pragya" as const, 
    label: "🛵 Pragya", 
    icon: Car,
    description: "Three-wheeled taxi" 
  },
  { 
    value: "Motorbike/Okada" as const, 
    label: "🏍️ Motorbike/Okada", 
    icon: Bike,
    description: "Two-wheeled motorcycle" 
  },
  { 
    value: "Tricycle/Aboboyaa" as const, 
    label: "🛺 Tricycle/Aboboyaa", 
    icon: Zap,
    description: "Three-wheeled vehicle" 
  },
] as const;

type VehicleCategory = typeof VEHICLE_CATEGORIES[number]["value"];

export function VehicleInfoStep({ form }: VehicleInfoStepProps) {
  const selectedCategory = form.watch("vehicleCategory");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide details about your vehicle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Category */}
        <FormField
          control={form.control}
          name="vehicleCategory"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-base font-semibold">
                Vehicle Category *
              </FormLabel>
              <Select 
                value={field.value || ""} 
                onValueChange={(value) => {
                  field.onChange(value as VehicleCategory);
                }}
              >
                <FormControl>
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCategory && 
                  VEHICLE_CATEGORIES.find(c => c.value === selectedCategory)?.description}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Plate Number */}
        <FormField
          control={form.control}
          name="plateNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Plate Number *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., GR-1234-20"
                  {...field}
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Format: GR-0000-00
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Chassis Number */}
        <FormField
          control={form.control}
          name="chassisNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Chassis Number *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., JH2RC5305LM100001"
                  {...field}
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                VIN or chassis number from vehicle documents
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Category Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t">
        {VEHICLE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.value;
          
          return (
            <div
              key={category.value}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 bg-gray-50 hover:border-green-300"
              }`}
              onClick={() => {
                form.setValue("vehicleCategory", category.value as VehicleCategory);
              }}
            >
              <Icon className="h-8 w-8 mb-2 text-green-600" />
              <p className="font-semibold text-gray-900 text-sm">{category.label}</p>
              <p className="text-xs text-gray-600 mt-1">{category.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}