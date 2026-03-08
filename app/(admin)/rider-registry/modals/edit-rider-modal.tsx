"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { updateRider, type RiderRecord } from "@/lib/rider-service";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
} from "@/app/lib/validations";

// ─── Import single source of truth ───────────────────────────────────────────
// DISTRICT_CODES keys = full official district names (e.g. "Krowor Municipal")
// CATEGORY_CODES keys = vehicle category names (e.g. "Motorbike", "Pragya")
import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditRiderModalProps {
  open:         boolean;
  rider:        (RiderRecord & { id: string }) | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?:  () => void;
}

// ─── Derived lists (always in sync with rin-constants) ───────────────────────

const DISTRICTS  = Object.keys(DISTRICT_CODES);   // ["Krowor Municipal", "Accra Metropolitan", ...]
const CATEGORIES = Object.keys(CATEGORY_CODES);   // ["Motorbike", "Tricycle", "Pragya", "Quadricycle"]

// ─── Component ────────────────────────────────────────────────────────────────

export function EditRiderModal({
  open, rider, onOpenChange, onSuccess,
}: EditRiderModalProps) {
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState("");
  const [successMessage,  setSuccessMessage]  = useState("");

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    defaultValues: {
      fullName: "", phoneNumber: "", idType: undefined, idNumber: "",
      dateOfBirth: "", gender: undefined, region: "Greater Accra",
      districtMunicipality: undefined, residentialTown: "",
      vehicleCategory: undefined, plateNumber: "", chassisNumber: "",
      driversLicenseNumber: "", licenseExpiryDate: "",
      nextOfKinName: "", nextOfKinContact: "", passportPhoto: undefined,
    },
  });

  // ── Populate form when rider changes ─────────────────────────────────────
  useEffect(() => {
    if (!rider) return;
    form.reset({
      fullName:             rider.fullName             || "",
      phoneNumber:          rider.phoneNumber          || "",
      idType:               rider.idType               || undefined,
      idNumber:             rider.idNumber             || "",
      dateOfBirth:          rider.dateOfBirth          || "",
      gender:               rider.gender               || undefined,
      region:               rider.region               || "Greater Accra",
      districtMunicipality: rider.districtMunicipality || undefined,
      residentialTown:      rider.residentialTown      || "",
      vehicleCategory:      rider.vehicleCategory      || undefined,
      plateNumber:          rider.plateNumber          || "",
      chassisNumber:        rider.chassisNumber        || "",
      driversLicenseNumber: rider.driversLicenseNumber || "",
      licenseExpiryDate:    rider.licenseExpiryDate    || "",
      nextOfKinName:        rider.nextOfKinName        || "",
      nextOfKinContact:     rider.nextOfKinContact     || "",
      passportPhoto:        undefined,                    // file edits not supported here
    });
    setError("");
    setSuccessMessage("");
  }, [rider, form]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: RiderRegistrationData) => {
    if (!rider?.id) return;
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // passportPhoto intentionally excluded — edited separately
      const updateData: Partial<RiderRecord> = {
        fullName:             data.fullName,
        phoneNumber:          data.phoneNumber,
        idType:               data.idType,
        idNumber:             data.idNumber,
        dateOfBirth:          data.dateOfBirth,
        gender:               data.gender,
        region:               data.region,
        districtMunicipality: data.districtMunicipality,
        residentialTown:      data.residentialTown,
        vehicleCategory:      data.vehicleCategory,
        plateNumber:          data.plateNumber.toUpperCase(),
        chassisNumber:        data.chassisNumber.toUpperCase(),
        driversLicenseNumber: data.driversLicenseNumber.toUpperCase(),
        licenseExpiryDate:    data.licenseExpiryDate,
        nextOfKinName:        data.nextOfKinName,
        nextOfKinContact:     data.nextOfKinContact,
      };

      const ok = await updateRider(rider.id, updateData);
      if (!ok) throw new Error("Update returned false — check rider-service");

      setSuccessMessage("Rider details updated successfully.");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1200);
    } catch (err) {
      console.error("EditRiderModal submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to update rider.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rider) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-50 bg-green-700 text-white px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-0.5">
              Edit Rider
            </p>
            <h2 className="text-xl font-bold leading-tight">{rider.fullName}</h2>
            <p className="text-xs text-green-300 font-mono mt-0.5">{rider.RIN}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-green-200 hover:text-white transition-colors mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Personal Information ── */}
              <Section title="Personal Information">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl><Input {...field} className="h-10" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10" maxLength={10} placeholder="0241234567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="idType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ghana Card">Ghana Card</SelectItem>
                          <SelectItem value="Voter's ID">Voter's ID</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="NHIS">NHIS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* ID Number — read-only, identity anchor */}
                  <FormField control={form.control} name="idNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number <span className="text-slate-400 font-normal">(locked)</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          className="h-10 bg-slate-50 text-slate-400 cursor-not-allowed font-mono"
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl><Input type="date" {...field} className="h-10" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Section>

              {/* ── Location Details ── */}
              <Section title="Location Details">
                {/* District — from DISTRICT_CODES, exact match required for RIN consistency */}
                <FormField control={form.control} name="districtMunicipality" render={({ field }) => (
                  <FormItem>
                    <FormLabel>District / Municipality *</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="residentialTown" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residential Town *</FormLabel>
                    <FormControl><Input {...field} className="h-10" placeholder="e.g. Teshie" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Section>

              {/* ── Vehicle Information ── */}
              <Section title="Vehicle Information">
                {/* Vehicle category — from CATEGORY_CODES, exact match for RIN prefix */}
                <FormField control={form.control} name="vehicleCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="plateNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Number *</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 uppercase font-mono" placeholder="GR-1234-XX" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="chassisNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chassis Number *</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 uppercase font-mono" placeholder="Enter chassis number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              {/* ── Compliance & Documents ── */}
              <Section title="Compliance & Documents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="driversLicenseNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver's License *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-10 uppercase font-mono"
                          placeholder="FAT-12345678-00001"
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="licenseExpiryDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Expiry *</FormLabel>
                      <FormControl><Input type="date" {...field} className="h-10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nextOfKinName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next of Kin Name *</FormLabel>
                      <FormControl><Input {...field} className="h-10" placeholder="Full name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="nextOfKinContact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next of Kin Contact *</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10" placeholder="0241234567" maxLength={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              {/* ── Sticky footer ── */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 flex gap-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-green-700 hover:bg-green-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
      <Card className="p-5 border-slate-200 space-y-4">{children}</Card>
    </div>
  );
}