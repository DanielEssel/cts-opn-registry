import PreRegistrationForm from "@/app/components/pre-registration/page";

// This is a PUBLIC page — no auth wrapper needed.
// Add to your Next.js routes at: app/(public)/pre-register/page.tsx

export const metadata = {
  title: "Rider Pre-Registration | CTS Africa",
  description:
    "Register before your training session. Your RIN will be issued after training is passed.",
};

export default function PreRegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <PreRegistrationForm />
    </main>
  );
}