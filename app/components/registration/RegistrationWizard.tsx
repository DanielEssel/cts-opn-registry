"use client"

import { useEffect, useState } from "react" // Added useEffect
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { riderSchema, type RiderFormValues } from "@/app/lib/validations"
import { Card, CardContent } from "@/components/ui/card"
import StepOnePersonal from "./StepOnePersonal"
import StepTwoLocation from "./StepTwoLocation"
import { useRouter } from "next/navigation"
import { saveRider } from "@/lib/rider-service"
import { auth, db } from "@/lib/firebase" // Added imports
import { doc, getDoc } from "firebase/firestore"

export function RegistrationWizard() {
  const [step, setStep] = useState(1)
  const [userProfile, setUserProfile] = useState<{role: string, entity: string} | null>(null)
  const router = useRouter()

  // 1. Fetch Admin Profile to determine their "Home Town"
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as any;
          setUserProfile(profile);
          
          // 2. AUTO-FILL TOWN for District Admins
          if (profile.role !== "Super Admin") {
            form.setValue("town", profile.entity);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
    // 3. FINAL SECURITY CHECK: Ensure the town is correct before sending to database
    const finalData = {
      ...data,
      town: userProfile?.role === "Super Admin" ? data.town : (userProfile?.entity || data.town),
      adminId: auth.currentUser?.uid, // Good for the Registry Log
      adminName: userProfile?.entity || "System"
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await saveRider(finalData, false);
        if (result.success) {
          router.push(`/register/success?opn=${result.opn}&name=${data.fullName}`);
          return;
        }
      } catch (error: any) {
        if (error.message === "OPN_EXISTS_RETRY") {
          attempts++;
          continue;
        }
        alert("Registration failed. Please try again.");
        break;
      }
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        {/* Step Indicator */}
        <div className="flex justify-between mb-8 px-2 relative">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 z-10">
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
          <div className="absolute top-5 left-1/2 -z-0 w-1/2 h-[2px] bg-slate-100 -translate-x-1/2" />
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
            // Pass userProfile so we can hide/disable the Town input for District Admins
            isAdmin={userProfile?.role === "Super Admin"}
          />
        )}
      </CardContent>
    </Card>
  )
}