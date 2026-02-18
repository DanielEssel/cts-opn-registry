"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface RegistrationStep {
  id: number;
  title: string;
  description: string;
}

interface RegistrationProgressProps {
  steps: RegistrationStep[];
  currentStep: number;
  completedSteps: number[];
}

// ============================================================================
// REGISTRATION PROGRESS COMPONENT
// ============================================================================

export function RegistrationProgress({
  steps,
  currentStep,
  completedSteps,
}: RegistrationProgressProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">
        Registration Progress
      </h3>

      {/* PROGRESS STEPS */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* ICON */}
              <div className="flex-shrink-0 mt-1">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Circle className="h-5 w-5 text-slate-400" />
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-semibold ${
                      isCompleted
                        ? "text-green-700"
                        : isCurrent
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    Step {step.id}: {step.title}
                  </p>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                      Completed
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROGRESS BAR */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Overall Progress</p>
          <p className="text-sm font-bold text-slate-900">
            {completedSteps.length} of {steps.length}
          </p>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300"
            style={{
              width: `${(completedSteps.length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}