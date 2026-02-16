import { RegistrationForm } from "@/app/components/registration/RegistrationForm";

export default function AdminRegisterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Register New Rider
        </h1>
        <p className="text-gray-600">
          Complete the multi-step registration process to issue an Operating Permit Number (OPN)
        </p>
      </div>

      <RegistrationForm />
    </div>
  );
}