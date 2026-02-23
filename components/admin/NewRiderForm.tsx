"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { riderSchema, RiderFormValues } from "@/app/lib/validations";
import { createRider } from "@/lib/rider-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, MapPin, Bike, ShieldCheck } from "lucide-react";

export default function NewRiderForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      region: "Greater Accra",
      gender: "Male",
    },
  });

  async function onSubmit(values: RiderFormValues) {
    setIsSubmitting(true);
    try {
      const opn = await createRider(values);
      toast.success(`Registration Successful! OPN: ${opn}`);
      // Redirect or Reset here
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <Card className="max-w-2xl mx-auto p-6 shadow-xl border-t-4 border-t-blue-600">
      <div className="mb-8 flex justify-between">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-2 w-full mx-1 rounded-full ${step >= i ? "bg-blue-600" : "bg-slate-100"}`} />
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><User className="text-blue-600"/> Bio Data</h2>
              <FormField name="fullName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="phoneNumber" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="024XXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="idNumber" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Ghana Card ID</FormLabel><FormControl><Input placeholder="GHA-000000000-0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              <Button type="button" onClick={nextStep} className="w-full">Next: Location Info</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="text-blue-600"/> Location (Pilot GR)</h2>
              <FormField name="districtMunicipality" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>District Municipality</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="TN">Teshie Nungua (Krowor)</SelectItem>
                      <SelectItem value="AC">Accra Metro (AMA)</SelectItem>
                      <SelectItem value="MD">Madina</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="residentialTown" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Town/Neighborhood</FormLabel><FormControl><Input placeholder="e.g. Agblezaa" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="w-full">Back</Button>
                <Button type="button" onClick={nextStep} className="w-full">Next: Vehicle Info</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Bike className="text-blue-600"/> Vehicle Category</h2>
              <FormField name="vehicleCategory" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="M">Motorbike (Okada)</SelectItem>
                      <SelectItem value="P">Pragya</SelectItem>
                      <SelectItem value="A">Aboboyaa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="plateNumber" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Chassis Number</FormLabel><FormControl><Input placeholder="VIN/Chassis" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="w-full">Back</Button>
                <Button type="button" onClick={nextStep} className="w-full">Next: Compliance</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-blue-600"/> Compliance & Next of Kin</h2>
              <FormField name="driversLicenseNumber" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Driver's License No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="nextOfKinContact" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Next of Kin Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="w-full">Back</Button>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Complete Registration & Issue OPN"}
                </Button>
              </div>
            </div>
          )}

        </form>
      </Form>
    </Card>
  );
}