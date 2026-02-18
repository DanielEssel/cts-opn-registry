"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import OperatorNavbar from "@/components/operator/operator-navbar";
import ApprovalsDashboard from "@/components/operator/approvals-dashboard";
import { BadgeIcon, Mail, Phone, MapPin, Heart } from "lucide-react";
import Link from "next/link";

export default function ApprovalsPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      <OperatorNavbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <ApprovalsDashboard />
      </div>

      <footer className="border-t border-green-200/30 bg-white/40 backdrop-blur-lg mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/register" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                    Register Rider
                  </Link>
                </li>
                <li>
                  <Link href="/operator/daily-report" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                    Daily Report
                  </Link>
                </li>
                <li>
                  <Link href="/operator/renewals" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                    Renewals
                  </Link>
                </li>
                <li>
                  <Link href="/operator/opn-issuance" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                    OPN Issuance
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <a href="tel:0800123456" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
                    0800-OPN-HELP
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <a href="mailto:support@opn.gov.gh" className="text-sm text-gray-600 hover:text-green-600 transition-colors">
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

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent mb-6" />

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