"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertTriangle, X } from "lucide-react";
import { updateRider, RiderRecord } from "@/lib/rider-service";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
} from "@/app/lib/validations";

// ============================================================================
// TYPES
// ============================================================================

interface EditRiderModalProps {
  open: boolean;
  rider: (RiderRecord & { id: string }) | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ============================================================================
// EDIT RIDER MODAL COMPONENT
// ============================================================================

export function EditRiderModal({
  open,
  rider,
  onOpenChange,
  onSuccess,
}: EditRiderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    defaultValues: {
      // Bio Data
      fullName: "",
      phoneNumber: "",
      idType: undefined,
      idNumber: "",
      dateOfBirth: "",
      gender: undefined,

      // Location
      region: "Greater Accra",
      districtMunicipality: undefined,
      residentialTown: "",

      // Vehicle Info
      vehicleCategory: undefined,
      plateNumber: "",
      chassisNumber: "",

      // Compliance
      driversLicenseNumber: "",
      licenseExpiryDate: "",
      nextOfKinName: "",
      nextOfKinContact: "",
      passportPhoto: undefined,
    },
  });

  // ========================================================================
  // UPDATE FORM WHEN RIDER CHANGES
  // ========================================================================

  useEffect(() => {
    if (rider) {
      form.reset({
        fullName: rider.fullName || "",
        phoneNumber: rider.phoneNumber || "",
        idType: rider.idType || undefined,
        idNumber: rider.idNumber || "",
        dateOfBirth: rider.dateOfBirth || "",
        gender: rider.gender || undefined,
        region: rider.region || "Greater Accra",
        districtMunicipality: rider.districtMunicipality || undefined,
        residentialTown: rider.residentialTown || "",
        vehicleCategory: rider.vehicleCategory || undefined,
        plateNumber: rider.plateNumber || "",
        chassisNumber: rider.chassisNumber || "",
        driversLicenseNumber: rider.driversLicenseNumber || "",
        licenseExpiryDate: rider.licenseExpiryDate || "",
        nextOfKinName: rider.nextOfKinName || "",
        nextOfKinContact: rider.nextOfKinContact || "",
        passportPhoto: undefined, // Can't edit file in modal
      });
    }
  }, [rider, form]);

  // ========================================================================
  // SUBMIT HANDLER
  // ========================================================================

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!rider?.id) throw new Error("No rider ID provided");

      // Prepare update data (exclude passportPhoto since it can't be edited here)
      const updateData: Partial<RiderRecord> = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        idType: data.idType,
        idNumber: data.idNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        region: data.region,
        districtMunicipality: data.districtMunicipality,
        residentialTown: data.residentialTown,
        town: data.residentialTown, // Also update town field
        vehicleCategory: data.vehicleCategory,
        plateNumber: data.plateNumber.toUpperCase(),
        chassisNumber: data.chassisNumber.toUpperCase(),
        driversLicenseNumber: data.driversLicenseNumber.toUpperCase(),
        licenseExpiryDate: data.licenseExpiryDate,
        nextOfKinName: data.nextOfKinName,
        nextOfKinContact: data.nextOfKinContact,
      };

      const success = await updateRider(rider.id, updateData);

      if (success) {
        setSuccessMessage("✓ Rider details updated successfully!");
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      } else {
        throw new Error("Failed to update rider");
      }
    } catch (err) {
      console.error("Error updating rider:", err);
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center">
          <div>
            <DialogTitle className="text-3xl font-bold text-white">
              Edit Rider Details
            </DialogTitle>
            <p className="text-green-100 text-sm mt-1">
              Update information for {rider.fullName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-6">
          {/* ALERTS */}
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-2 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* FORM */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* ============================================================
                  PERSONAL INFORMATION
                  ============================================================ */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Personal Information
                </h3>
                <Card className="p-6 bg-white border-slate-200 space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="Enter full name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11"
                              placeholder="0241234567"
                              maxLength={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Gender *
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
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
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            ID Type *
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
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
                              <SelectItem value="PASSPORT">Passport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            ID Number * (Read-only)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              className="h-11 bg-slate-50 text-slate-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Date of Birth *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </div>

              {/* ============================================================
                  LOCATION INFORMATION
                  ============================================================ */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Location Details
                </h3>
                <Card className="p-6 bg-white border-slate-200 space-y-4">
                  <FormField
                    control={form.control}
                    name="districtMunicipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          District/Municipality *
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Accra Metro">
                              Accra Metro
                            </SelectItem>
                            <SelectItem value="Krowor">Krowor</SelectItem>
                            <SelectItem value="Madina">Madina</SelectItem>
                            <SelectItem value="Ashaiman">Ashaiman</SelectItem>
                            <SelectItem value="Tema Metro">
                              Tema Metro
                            </SelectItem>
                            <SelectItem value="Ga South">Ga South</SelectItem>
                            <SelectItem value="Ga West">Ga West</SelectItem>
                            <SelectItem value="Ga East">Ga East</SelectItem>
                            <SelectItem value="Ga Central">
                              Ga Central
                            </SelectItem>
                            <SelectItem value="Ledzokuku">Ledzokuku</SelectItem>
                            <SelectItem value="Ablekuma North">
                              Ablekuma North
                            </SelectItem>
                            <SelectItem value="Ablekuma Central">
                              Ablekuma Central
                            </SelectItem>
                            <SelectItem value="Ablekuma West">
                              Ablekuma West
                            </SelectItem>
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
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Residential Town *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="Enter town name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </div>

              {/* ============================================================
                  VEHICLE INFORMATION
                  ============================================================ */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Vehicle Information
                </h3>
                <Card className="p-6 bg-white border-slate-200 space-y-4">
                  <FormField
                    control={form.control}
                    name="vehicleCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Vehicle Category *
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pragya">Pragya</SelectItem>
                            <SelectItem value="Motorbike/Okada">
                              Motorbike/Okada
                            </SelectItem>
                            <SelectItem value="Tricycle/Aboboyaa">
                              Tricycle/Aboboyaa
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="plateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Plate Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 uppercase"
                              placeholder="e.g., GR-1234-XX"
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
                          <FormLabel className="font-semibold">
                            Chassis Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 uppercase"
                              placeholder="Enter chassis number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </div>

              {/* ============================================================
                  COMPLIANCE & DOCUMENTS
                  ============================================================ */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Compliance & Documents
                </h3>
                <Card className="p-6 bg-white border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="driversLicenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Driver's License *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 uppercase font-mono"
                              placeholder="FAT-12345678-00001"
                              maxLength={16}
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
                          <FormLabel className="font-semibold">
                            License Expiry *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nextOfKinName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Next of Kin Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="John Doe Mensah"
                          />
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
                        <FormLabel className="font-semibold">
                          Next of Kin Contact *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-11"
                            placeholder="0241234567"
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </div>

              {/* ============================================================
                  ACTIONS - STICKY FOOTER
                  ============================================================ */}
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white pt-6 flex gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 font-semibold"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 h-11 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
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