import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ClipboardCheck, LayoutDashboard, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Simple Header */}
      <header className="px-6 h-20 flex items-center border-b bg-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">PermitTrack</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl space-y-6">
          <Badge variant="outline" className="py-1 px-4 text-blue-600 bg-blue-50 border-blue-200">
            Official Government Portal
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Streamlining Motor Rider <span className="text-blue-600">Compliance.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A secure platform for riders to register, receive unique Operating Permit Numbers (OPNs), and manage renewals efficiently.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button asChild size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-lg">
              <Link href="/register">
                Register as a Rider <ClipboardCheck className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-white">
              <Link href="/dashboard">
                Admin Portal <LayoutDashboard className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-white">
              <Link href="/retrieve">
                Retrieve OPN <LayoutDashboard className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
              <ClipboardCheck />
            </div>
            <h3 className="font-bold text-lg">Easy Registration</h3>
            <p className="text-slate-500 text-sm mt-2">Fast, mobile-friendly registration for all motor riders across districts.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
              <ShieldCheck />
            </div>
            <h3 className="font-bold text-lg">Unique OPNs</h3>
            <p className="text-slate-500 text-sm mt-2">Automated generation of unique identification numbers for easy tracking.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border shadow-sm">
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 text-amber-600">
              <ArrowRight />
            </div>
            <h3 className="font-bold text-lg">Auto Renewals</h3>
            <p className="text-slate-500 text-sm mt-2">Get notified via SMS when your permit is about to expire.</p>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t text-center text-slate-400 text-sm">
        © 2026 CTS Compliance Systems. All rights reserved.
      </footer>
    </div>
  );
}

// Helper Badge Component (since shadcn install might be pending)
function Badge({ children, className, variant }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}