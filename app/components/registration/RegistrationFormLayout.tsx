"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Edit,
  Circle,
  Check,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { BioDataStep } from "./steps/bio-data-step";
import { LocationStep } from "./steps/location-step";
import { VehicleInfoStep } from "./steps/vehicle-info-step";
import { ComplianceStep } from "./steps/compliance-step";
import { PreviewStep } from "./steps/preview-step";
import { SuccessPage } from "@/app/components/registration/SuccessPage";

const STEPS = [
  { id: 1, title: "Bio Data", description: "Personal Information" },
  { id: 2, title: "Location", description: "Residential Details" },
  { id: 3, title: "Vehicle", description: "Vehicle Information" },
  { id: 4, title: "Compliance", description: "Documents & License" },
  { id: 5, title: "Review", description: "Verify Information" },
];

export function RegistrationFormLayout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedOPN, setGeneratedOPN] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderTown, setRiderTown] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<RiderRegistrationData>({
    resolver: zodResolver(riderRegistrationSchema),
    defaultValues: {
      region: "Greater Accra",
      fullName: "",
      phoneNumber: "",
      ghanaCardNumber: "",
      dateOfBirth: "",
      gender: undefined,
      districtMunicipality: undefined,
      residentialTown: "",
      vehicleCategory: undefined,
      plateNumber: "",
      chassisNumber: "",
      driversLicenseNumber: "",
      licenseExpiryDate: "",
      nextOfKinContact: "",
    },
    mode: "onChange",
  });

  const watchPhoto = form.watch("passportPhoto");
  
  // Photo preview handler
  useState(() => {
    if (watchPhoto instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchPhoto);
    }
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof RiderRegistrationData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = Object.keys(bioDataSchema.shape) as (keyof RiderRegistrationData)[];
        break;
      case 2:
        fieldsToValidate = Object.keys(locationSchema.shape) as (keyof RiderRegistrationData)[];
        break;
      case 3:
        fieldsToValidate = Object.keys(vehicleInfoSchema.shape) as (keyof RiderRegistrationData)[];
        break;
      case 4:
        fieldsToValidate = Object.keys(complianceSchema.shape) as (keyof RiderRegistrationData)[];
        break;
      case 5:
        return form.formState.isValid;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
    setError("");
  };

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await saveRiderRegistration(data);
      
      if (result.success) {
        setGeneratedOPN(result.opn);
        setRiderName(data.fullName);
        setRiderTown(data.residentialTown);
        setSubmitSuccess(true);
        form.reset();
        setPhotoPreview(null);
      } else {
        setError(result.error || "Failed to register. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register rider. Please try again."
      );
      setIsSubmitting(false);
    }
  };

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
          <PreviewStep 
            data={form.getValues()} 
            photoPreview={photoPreview}
          />
        );
      default:
        return null;
    }
  };

  const isStepComplete = (step: number) => {
    return step < currentStep;
  };

  // Success Screen
  if (submitSuccess) {
    return (
      <SuccessPage 
        opn={generatedOPN}
        name={riderName}
        town={riderTown}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* HEADER */}
        <div className="py-6 border-b border-green-200/30">
          <h1 className="text-2xl font-bold text-gray-900">Rider Registration</h1>
          <p className="text-sm text-gray-600 mt-1">Step {currentStep} of {STEPS.length}</p>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8 py-8">
          {/* LEFT SIDE - STEP INDICATOR (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-2 w-64 flex-shrink-0">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleEdit(step.id)}
                className={`relative p-4 rounded-2xl text-left transition-all duration-300 group ${
                  currentStep === step.id
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                    : isStepComplete(step.id)
                    ? "bg-green-100/50 text-green-700 hover:bg-green-100"
                    : "bg-white/50 text-gray-600 hover:bg-white/70 border border-slate-200/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isStepComplete(step.id) ? (
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : currentStep === step.id ? (
                      <div className="h-6 w-6 rounded-full bg-white/30 border-2 border-white flex items-center justify-center font-bold">
                        {step.id}
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-current opacity-40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-xs opacity-70">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-green-200/50 shadow-xl p-8">
              {error && (
                <Alert variant="destructive" className="mb-6 border-2">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* STEP INDICATOR MOBILE */}
                  <div className="lg:hidden mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      {STEPS.map((step) => (
                        <div
                          key={step.id}
                          className={`h-2 flex-1 rounded-full mx-1 transition-all ${
                            step.id <= currentStep
                              ? "bg-gradient-to-r from-green-600 to-emerald-600"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-600 text-center">
                      {STEPS[currentStep - 1].title} — {STEPS[currentStep - 1].description}
                    </p>
                  </div>

                  {/* FORM CONTENT */}
                  <div className="min-h-[300px]">
                    {renderStep()}
                  </div>

                  {/* NAVIGATION BUTTONS */}
                  <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1 || isSubmitting}
                      size="lg"
                      className="border-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
        
                    <div className="flex gap-3">
                      {currentStep === 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleEdit(1)}
                          disabled={isSubmitting}
                          size="lg"
                          className="border-2"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </Button>
                      )}
        
                      {currentStep < STEPS.length ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={isSubmitting}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 shadow-lg min-w-[140px]"
                        >
                          {currentStep === 4 ? "Review" : "Next Step"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={false}
                          size="lg"
                          className={`bg-green-600 hover:bg-green-700 shadow-lg min-w-[180px] transition-all ${
                            isSubmitting ? "opacity-75" : ""
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Submit Registration
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}