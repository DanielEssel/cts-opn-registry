import { RegistrationWizard } from "@/app/components/registration/RegistrationWizard";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Branding/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Motor Rider Registry
          </h1>
          <p className="text-slate-500 mt-2">Complete the form to receive your OPN</p>
        </div>

        <RegistrationWizard />
      </div>
    </main>
  );
}