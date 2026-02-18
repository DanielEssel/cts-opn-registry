"use client";

import { useState } from "react";
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
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
} from "@/app/lib/validations";

interface EditRiderModalProps {
  open: boolean;
  rider: any | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

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
      fullName: rider?.fullName || "",
      phoneNumber: rider?.phoneNumber || "",
      ghanaCardNumber: rider?.ghanaCardNumber || "",
      dateOfBirth: rider?.dateOfBirth || "",
      gender: rider?.gender || undefined,
      region: rider?.region || "Greater Accra",
      districtMunicipality: rider?.districtMunicipality || undefined,
      residentialTown: rider?.residentialTown || "",
      vehicleCategory: rider?.vehicleCategory || undefined,
      plateNumber: rider?.plateNumber || "",
      chassisNumber: rider?.chassisNumber || "",
      driversLicenseNumber: rider?.driversLicenseNumber || "",
      licenseExpiryDate: rider?.licenseExpiryDate || "",
      nextOfKinContact: rider?.nextOfKinContact || "",
    },
  });

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!rider?.id) throw new Error("No rider ID provided");

      const riderRef = doc(db, "riders", rider.id);
      await updateDoc(riderRef, {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        ghanaCardNumber: data.ghanaCardNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        region: data.region,
        districtMunicipality: data.districtMunicipality,
        residentialTown: data.residentialTown,
        vehicleCategory: data.vehicleCategory,
        plateNumber: data.plateNumber.toUpperCase(),
        chassisNumber: data.chassisNumber.toUpperCase(),
        driversLicenseNumber: data.driversLicenseNumber.toUpperCase(),
        licenseExpiryDate: data.licenseExpiryDate,
        nextOfKinContact: data.nextOfKinContact,
        updatedAt: new Date(),
      });

      setSuccessMessage("✓ Rider details updated successfully!");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error("Error updating rider:", err);
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[70vh] overflow-y-auto rounded-2xl p-0 border-0 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <DialogTitle className="text-3xl font-bold text-white">
              Edit Rider Details
            </DialogTitle>
            <p className="text-blue-100 text-sm mt-1">
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

        {/* Content */}
        <div className="p-8 space-y-6">
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
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
                        <FormLabel className="font-semibold">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="rounded-lg h-10"
                            placeholder="Enter full name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="rounded-lg h-10"
                              placeholder="10 digits"
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
                          <FormLabel className="font-semibold">Gender</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-lg h-10">
                                <SelectValue />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ghanaCardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Ghana Card (Read-only)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled
                              className="rounded-lg h-10 bg-slate-50 text-slate-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="rounded-lg h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </div>

              {/* Location Information */}
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
                          District/Municipality
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg h-10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Accra Metro">Accra Metro</SelectItem>
                            <SelectItem value="Krowor">Krowor</SelectItem>
                            <SelectItem value="Madina">Madina</SelectItem>
                            <SelectItem value="Ashaiman">Ashaiman</SelectItem>
                            <SelectItem value="Tema Metro">Tema Metro</SelectItem>
                            <SelectItem value="Ga South">Ga South</SelectItem>
                            <SelectItem value="Ga West">Ga West</SelectItem>
                            <SelectItem value="Ga East">Ga East</SelectItem>
                            <SelectItem value="Ga Central">Ga Central</SelectItem>
                            <SelectItem value="Ledzokuku">Ledzokuku</SelectItem>
                            <SelectItem value="Ablekuma North">Ablekuma North</SelectItem>
                            <SelectItem value="Ablekuma Central">Ablekuma Central</SelectItem>
                            <SelectItem value="Ablekuma West">Ablekuma West</SelectItem>
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
                          Residential Town
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="rounded-lg h-10"
                            placeholder="Enter town name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </div>

              {/* Vehicle Information */}
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
                          Vehicle Category
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg h-10">
                              <SelectValue />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="plateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Plate Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="rounded-lg h-10 uppercase"
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
                            Chassis Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="rounded-lg h-10 uppercase"
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

              {/* Compliance & Documents */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Compliance & Documents
                </h3>
                <Card className="p-6 bg-white border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="driversLicenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Driver's License
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="rounded-lg h-10"
                              placeholder="License number"
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
                            License Expiry
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="rounded-lg h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nextOfKinContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Next of Kin Contact
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="rounded-lg h-10"
                            placeholder="10 digits"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </div>

              {/* Actions - Sticky Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white pt-4 flex gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-lg h-11 font-semibold"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg h-11 font-semibold"
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