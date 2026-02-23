"use client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DISTRICT_CODES, type RiderFormValues } from "@/app/lib/validations";
import type { UseFormReturn } from "react-hook-form";

interface StepTwoProps {
  form: UseFormReturn<RiderFormValues>;
  onBack: () => void;
  onNext: () => void;        // renamed: this step should go Next, not Submit
  isSubmitting: boolean;
}

export default function StepTwoLocation({
  form,
  onBack,
  onNext,
  isSubmitting,
}: StepTwoProps) {
  const selectedDistrict = form.watch("districtMunicipality");
  const selectedTown = form.watch("residentialTown");

  // Estimated OPN preview (districtCode-XXXX-MM-YY)
  const getPreview = () => {
    const code =
      selectedDistrict && DISTRICT_CODES[selectedDistrict]
        ? DISTRICT_CODES[selectedDistrict]
        : "??";

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);

    return `${code}-XXXX-${month}-${yy}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
          Estimated OPN
        </span>
        <p className="text-2xl font-mono font-black text-blue-700">
          {getPreview()}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Based on District/Municipality (final number is assigned on submit)
        </p>
      </div>

      {/* Region (fixed to Greater Accra) */}
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Region</FormLabel>
            <FormControl>
              <Input {...field} disabled className="h-12" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* District/Municipality */}
      <FormField
        control={form.control}
        name="districtMunicipality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>District / Municipality</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.keys(DISTRICT_CODES).map((district) => (
                  <SelectItem key={district} value={district}>
                    {district} ({DISTRICT_CODES[district]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Residential Town */}
      <FormField
        control={form.control}
        name="residentialTown"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Residential Town</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Agblezaa"
                {...field}
                className="h-12"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>

      {/* tiny debug preview (optional) */}
      {(selectedDistrict || selectedTown) && (
        <div className="text-xs text-slate-500">
          <div>Selected District: {selectedDistrict || "—"}</div>
          <div>Residential Town: {selectedTown || "—"}</div>
        </div>
      )}
    </div>
  );
}