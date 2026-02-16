import { LookupForm } from "@/app/components/opn-look-up/lookup-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LookupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Retrieve Your OPN
          </h1>
          <p className="text-lg text-gray-600">
            Find your Operating Permit Number using your Ghana Card or Phone Number
          </p>
        </div>

        <LookupForm />
      </div>
    </main>
  );
}