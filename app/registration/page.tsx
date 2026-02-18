"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import OperatorNavbar from "@/components/operator/operator-navbar";
import { RegistrationFormLayout } from "@/app/components/registration/RegistrationFormLayout";
import { BadgeIcon, Mail, Phone, MapPin, Heart } from "lucide-react";
import Link from "next/link";

interface OperatorProfile {
  fullName: string;
  email: string;
  entity: string;
  phone?: string;
}

export default function OperatorRegistry() {
  const router = useRouter();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth guard and fetch profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const docRef = doc(db, "admin_users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          router.push("/login");
          return;
        }

        const data = docSnap.data();

        // Verify operator role
        if (data.role !== "Operator" && data.role !== "District Admin") {
          router.push("/login");
          return;
        }

        setProfile({
          fullName: data.fullName || "Operator",
          email: user.email || "",
          entity: data.entity || "N/A",
          phone: data.phone,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <BadgeIcon className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* NAVBAR */}
      <OperatorNavbar />

      {/* FORM - FLEX-1 TO PUSH FOOTER DOWN */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            Register New Rider
          </h1>
          <p className="text-slate-500 font-medium">
            Quick permit registration for {profile.entity}
          </p>
        </div>
        <RegistrationFormLayout />
      </div>

      {/* FOOTER */}
      <footer className="border-t border-green-200/30 bg-white/40 backdrop-blur-lg mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* LEFT - BRAND */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <BadgeIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">OPN Registry</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ghana's trusted Operating Permit Number registration system for riders and operators.
              </p>
            </div>

            {/* CENTER - QUICK LINKS */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/operator/daily-report"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Daily Report
                  </Link>
                </li>
                <li>
                  <Link
                    href="/operator/renewals"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Renewals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/operator/opn-issuance"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    OPN Issuance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/operator/approvals"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Approvals
                  </Link>
                </li>
              </ul>
            </div>

            {/* RIGHT - CONTACT */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <a
                    href="tel:0800123456"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    0800-OPN-HELP
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <a
                    href="mailto:support@opn.gov.gh"
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    support@opn.gov.gh
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Greater Accra, Ghana</span>
                </li>
              </ul>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent mb-6" />

          {/* BOTTOM */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              &copy; 2024 Operating Permit Number Registry. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <span>by OPN Team</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}