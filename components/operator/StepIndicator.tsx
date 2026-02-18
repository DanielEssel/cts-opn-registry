"use client";

import { CheckCircle2, Circle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* DESKTOP VIEW */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* STEP CIRCLE */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2 text-center">
                  {step.title}
                </p>
              </div>

              {/* CONNECTOR LINE */}
              {!isLast && (
                <div
                  className={`flex-1 h-1 mx-4 transition-all ${
                    isCompleted ? "bg-green-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCompleted
                      ? "bg-green-600"
                      : isCurrent
                      ? "bg-blue-600"
                      : "bg-slate-200"
                  }`}
                />
                <p className="text-xs font-semibold text-slate-700 mt-2 text-center">
                  {step.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}