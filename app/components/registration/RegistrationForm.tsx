"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Edit,
  Sparkles,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  riderRegistrationSchema,
  type RiderRegistrationData,
  bioDataSchema,
  locationSchema,
  vehicleInfoSchema,
  complianceSchema,
} from "@/app/lib/validations";

import { saveRiderRegistration } from "@/lib/rider-service";
import { StepIndicator } from "./Step-Indicator";
import { BioDataStep } from "./steps/bio-data-step";
import { LocationStep } from "./steps/location-step";
import { VehicleInfoStep } from "./steps/vehicle-info-step";
import { ComplianceStep } from "./steps/compliance-step";
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
// REGISTRATION FORM COMPONENT
// ============================================================================

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedOPN, setGeneratedOPN] = useState("");
  const [generatedRiderId, setGeneratedRiderId] = useState("");
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
    mode: "onChange",
  });

  // Watch for photo changes to update preview
  const watchPhoto = form.watch("passportPhoto");

  // Update photo preview when photo changes
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

  /**
   * Validate current step before proceeding
   */
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
  // NAVIGATION HANDLERS
  // ========================================================================

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ========================================================================
  // SUBMIT HANDLER
  // ========================================================================

  const onSubmit = async (data: RiderRegistrationData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await saveRiderRegistration(data);

      if (result.success) {
        setGeneratedOPN(result.opn);
        setGeneratedRiderId(result.riderId);
        setSubmitSuccess(true);
        form.reset();
        setPhotoPreview(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error || "Failed to register rider. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register rider. Please try again."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (submitSuccess) {
    return (
      <Card className="max-w-3xl mx-auto border-2 border-green-100 shadow-2xl">
        <CardContent className="pt-16 pb-16 px-8">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Success Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-60 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-green-600 flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <Badge className="mb-2 bg-green-100 text-green-700 border-green-200 px-4 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Registration Complete
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Successfully Registered!
              </h2>
              <p className="text-lg text-gray-600">
                The Operating Permit Number has been generated
              </p>
            </div>

            {/* OPN Display */}
            <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
              <p className="text-sm font-semibold text-green-700 mb-3 uppercase tracking-wide">
                Operating Permit Number
              </p>
              <p className="text-4xl md:text-5xl font-bold text-green-700 font-mono tracking-wider break-all">
                {generatedOPN}
              </p>
              {generatedRiderId && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-green-600 mb-1">Rider ID</p>
                  <p className="text-sm font-mono text-green-700">{generatedRiderId}</p>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">✓</div>
                <p className="text-sm font-medium text-gray-900">
                  Valid 6 Months
                </p>
                <p className="text-xs text-gray-500">From today</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">📱</div>
                <p className="text-sm font-medium text-gray-900">Keep Safe</p>
                <p className="text-xs text-gray-500">Save this number</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🛡️</div>
                <p className="text-sm font-medium text-gray-900">
                  Present Always
                </p>
                <p className="text-xs text-gray-500">During checks</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
              <Button
                onClick={() => {
                  setSubmitSuccess(false);
                  setGeneratedOPN("");
                  setGeneratedRiderId("");
                  setCurrentStep(1);
                }}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                Register Another Rider
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 border-2"
                onClick={() => window.print()}
              >
                Print Certificate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========================================================================
  // REGISTRATION FORM
  // ========================================================================

  return (
    <Card className="max-w-5xl mx-auto shadow-xl border-2 border-gray-100">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              🏍️ Rider Registration
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-green-600 text-green-700"
              >
                Greater Accra Region
              </Badge>
              Operating Permit System
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-gray-500">Step</p>
              <p className="text-2xl font-bold text-green-600">
                {currentStep} / {STEPS.length}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-8">
        {/* Step Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-2">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step Content */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
              {/* Back Button */}
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

              {/* Right Action Buttons */}
              <div className="flex gap-3">
                {/* Edit Button - Only on Review Step */}
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

                {/* Next Button or Submit Button */}
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
                  // SUBMIT BUTTON - Review Step
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 shadow-lg min-w-[180px]"
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
      </CardContent>
    </Card>
  );
}