"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { riderSchema, type RiderFormValues } from "@/app/lib/validations"
import { Card, CardContent } from "@/components/ui/card"
import StepOnePersonal from "./StepOnePersonal"
import StepTwoLocation from "./StepTwoLocation"
import { useRouter } from "next/navigation"

export function RegistrationWizard() {
  const [step, setStep] = useState(1)
  const router = useRouter()

  const form = useForm<RiderFormValues>({
    resolver: zodResolver(riderSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phone: "",
      town: "",
      licensePlate: "",
    },
  })

  const onSubmit = async (data: RiderFormValues) => {
    // This is where we will call our Next.js Server Action later
    console.log("Final Submission Data:", data)
    router.push("/register/success")
  }

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        {/* Step Indicator */}
        <div className="flex justify-between mb-8 px-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= i ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {i}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {i === 1 ? "Personal" : "Vehicle"}
              </span>
            </div>
          ))}
          {/* Visual line connecting the steps */}
          <div className="absolute top-12 left-1/2 -z-10 w-1/3 h-[2px] bg-slate-100 -translate-x-1/2" />
        </div>

        {/* Step Rendering */}
        {step === 1 && (
          <StepOnePersonal 
            form={form} 
            onNext={async () => {
              const isValid = await form.trigger(["fullName", "phone"])
              if (isValid) setStep(2)
            }} 
          />
        )}

        {step === 2 && (
          <StepTwoLocation 
            form={form} 
            onBack={() => setStep(1)} 
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={form.formState.isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  )
}