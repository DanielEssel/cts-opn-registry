"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
  bioDataSchema,
  locationSchema,
  vehicleInfoSchema,
  complianceSchema,
} from "@/app/lib/validations";
import { saveRiderRegistration } from "@/lib/rider-service";
import { RegistrationProgress } from "@/components/operator/RegistrationProgress";
import { StepIndicator } from "@/components/operator/StepIndicator";
import { BioDataStep } from "@/app/components/registration/steps/bio-data-step";
import { LocationStep } from "@/app/components/registration/steps/location-step";
import { VehicleInfoStep } from "@/app/components/registration/steps/vehicle-info-step";
import { ComplianceStep } from "@/app/components/registration/steps/compliance-step";
import { PreviewStep } from "./steps/preview-step";

// ============================================================================
// REGISTRATION STEPS
// ============================================================================

const STEPS = [
  { id: 1, title: "Bio Data", description: "Personal Information" },
  { id: 2, title: "Location", description: "Residential Details" },
  { id: 3, title: "Vehicle", description: "Vehicle Information" },
  { id: 4, title: "Compliance", description: "Documents & License" },
  { id: 5, title: "Review", description: "Verify Information" },
];

// ============================================================================
// REGISTRATION PAGE
// ============================================================================

export default function RegistrationPage() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState<number>(
    stepParam ? parseInt(stepParam) : 1
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedOPN, setGeneratedOPN] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    mode: "onChange",
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

  // Watch for photo changes to update preview
  const watchPhoto = form.watch("passportPhoto");

  useState(() => {
    if (watchPhoto instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchPhoto);
    }
  });

  // ========================================================================
  // VALIDATE STEP
  // ========================================================================

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof RiderRegistrationData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = Object.keys(
          bioDataSchema.shape
        ) as (keyof RiderRegistrationData)[];
        break;
      case 2:
        fieldsToValidate = Object.keys(
          locationSchema.shape
        ) as (keyof RiderRegistrationData)[];
        break;
      case 3:
        fieldsToValidate = Object.keys(
          vehicleInfoSchema.shape
        ) as (keyof RiderRegistrationData)[];
        break;
      case 4:
        fieldsToValidate = Object.keys(
          complianceSchema.shape
        ) as (keyof RiderRegistrationData)[];
        break;
      case 5:
        // Preview step - validate all fields
        return form.formState.isValid;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  // ========================================================================
  // HANDLE NEXT
  // ========================================================================

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCompletedSteps([...new Set([...completedSteps, currentStep])]);
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ========================================================================
  // HANDLE BACK
  // ========================================================================

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================================================
  // HANDLE SUBMIT
  // ========================================================================

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await saveRiderRegistration(data);

      if (result.success) {
        setGeneratedOPN(result.opn);
        setSuccess(true);
        setCompletedSteps([...new Set([...completedSteps, currentStep])]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error || "Failed to register rider.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER STEP
  // ========================================================================

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BioDataStep form={form} />;
      case 2:
        return <LocationStep form={form} />;
      case 3:
        return <VehicleInfoStep form={form} />;
      case 4:
        return <ComplianceStep form={form} />;
      case 5:
        return (
          <PreviewStep data={form.getValues()} photoPreview={photoPreview} />
        );
      default:
        return null;
    }
  };

  // ========================================================================
  // SUCCESS SCREEN
  // ========================================================================

  if (success) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PROGRESS SIDEBAR */}
        <div className="lg:col-span-1">
          <RegistrationProgress
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* SUCCESS CONTENT */}
        <div className="lg:col-span-3">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-12">
            <div className="text-center space-y-6">
              {/* SUCCESS ICON */}
              <div className="flex justify-center">
                <div className="p-4 bg-green-600 rounded-full">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>

              {/* SUCCESS MESSAGE */}
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-green-900">
                  Registration Successful!
                </h2>
                <p className="text-lg text-green-700">
                  The Operating Permit Number has been generated
                </p>
              </div>

              {/* OPN DISPLAY */}
              <div className="p-6 bg-white border-2 border-green-300 rounded-lg">
                <p className="text-sm font-semibold text-green-700 uppercase mb-2">
                  Operating Permit Number
                </p>
                <p className="text-4xl font-bold font-mono text-green-900">
                  {generatedOPN}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setCurrentStep(1);
                    setCompletedSteps([]);
                    setPhotoPreview(null);
                    form.reset();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Register Another Rider
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.print()}>
                  Print Certificate
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ========================================================================
  // REGISTRATION FORM
  // ========================================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* PROGRESS SIDEBAR */}
      <div className="lg:col-span-1">
        <RegistrationProgress
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="lg:col-span-3">
        <Card className="p-8">
          {/* STEP INDICATOR */}
          <StepIndicator steps={STEPS} currentStep={currentStep} />

          {/* ERROR ALERT */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* FORM */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* STEP CONTENT */}
              <div>{renderStep()}</div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between items-center pt-8 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}