"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UseFormReturn } from "react-hook-form"
import { RiderFormValues } from "@/app/lib/validations"
import { User, Phone } from "lucide-react"

interface StepOneProps {
  form: UseFormReturn<RiderFormValues>
  onNext: () => void
}

export default function StepOnePersonal({ form, onNext }: StepOneProps) {
  return (
    <Form {...form}>
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="space-y-4">
          {/* Full Name Field */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Rider Full Name</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <FormControl>
                    <Input 
                      placeholder="e.g. Kwesi Mensah" 
                      {...field} 
                      className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Number Field */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">Phone Number</FormLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="024 000 0000" 
                      {...field} 
                      className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <Button 
            type="button" 
            onClick={onNext} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Next: Location Details
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4">
            Your data is secured and will only be used for RIN issuance.
          </p>
        </div>
      </div>
    </Form>
  )
}