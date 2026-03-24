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
import { CheckCircle2 } from "lucide-react";

interface VehicleInfoStepProps {
  form: UseFormReturn<RiderRegistrationData>;
}

// Must match CATEGORY_CODES keys in lib/rin-constants.ts exactly
const VEHICLE_CATEGORIES = [
  {
    value: "Motorbike",
    emoji: "🏍️",
    label: "Motorbike",
    local: "Okada",
    code: "M",
  },
  {
    value: "Tricycle",
    emoji: "🛺", 
    label: "Tricycle",
    local: "Aboboyaa",
    code: "T",
  },
  {
    value: "Pragya",
    emoji: "🛺",
    label: "Pragya",
    local: "3-wheel taxi",
    code: "P",
  },
  {
    value: "Quadricycle",
    emoji: "🚙",
    label: "Quadricycle",
    local: "4-wheel light",
    code: "Q",
  },
] as const;

type VehicleCategory = typeof VEHICLE_CATEGORIES[number]["value"];

export function VehicleInfoStep({ form }: VehicleInfoStepProps) {
  const selectedCategory = form.watch("vehicleCategory");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Vehicle Information</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a vehicle type and provide registration details
        </p>
      </div>

      {/* ── Vehicle Category ──────────────────────────────────────────── */}
      <FormField
        control={form.control}
        name="vehicleCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold text-gray-700">
              Vehicle Category <span className="text-red-500">*</span>
            </FormLabel>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {VEHICLE_CATEGORIES.map((cat) => {
                const isSelected = field.value === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      form.setValue("vehicleCategory", cat.value as VehicleCategory, {
                        shouldValidate: true,
                      })
                    }
                    className={`
                      relative flex items-center gap-4 px-4 py-4 rounded-xl border-2
                      text-left transition-all duration-150
                      ${isSelected
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    {/* Emoji */}
                    <span className="text-3xl shrink-0 leading-none">{cat.emoji}</span>

                    {/* Labels */}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-none ${isSelected ? "text-green-800" : "text-gray-800"}`}>
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{cat.local}</p>
                    </div>

                    {/* Code badge */}
                    <span className={`
                      ml-auto shrink-0 text-[10px] font-black w-6 h-6 rounded-md
                      flex items-center justify-center
                      ${isSelected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}
                    `}>
                      {cat.code}
                    </span>

                    {/* Selected check */}
                    {isSelected && (
                      <span className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <FormMessage className="mt-2" />
          </FormItem>
        )}
      />

      {/* ── Plate & Chassis ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">
        <FormField
          control={form.control}
          name="plateNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Plate Number <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., GR-1234-20"
                  {...field}
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <p className="text-xs text-gray-400 mt-1">
                As shown on vehicle registration document
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chassisNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-gray-700">
                Chassis Number <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., JH2RC5305LM100001"
                  {...field}
                  className="h-11"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <p className="text-xs text-gray-400 mt-1">
                VIN / chassis number from vehicle documents — letters and numbers only
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}