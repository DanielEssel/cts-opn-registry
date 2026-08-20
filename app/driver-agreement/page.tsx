"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, HandshakeIcon, Wallet, AlertTriangle } from "lucide-react";

const DriverAgreementPage = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 font-sans text-gray-800">
      {/* Back Button */}

      {/* Header with Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <HandshakeIcon className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-700">Driver &amp; Rider Agreement</h1>
      </div>

      <p className="mb-4 text-sm text-gray-500">Effective Date: 24 March 2026</p>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl">
        <p className="text-sm text-amber-800">
          <strong>🤝 Agreement Notice:</strong> This Driver &amp; Rider Agreement applies to everyone
          who provides transport, delivery, or gas services through the CTS Go platform. By
          completing driver setup, you agree to these terms in addition to our Terms of Service and
          Privacy Policy.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <HandshakeIcon className="h-5 w-5" /> 1. Independent Contractor Relationship
          </h2>
          <p className="text-gray-700">
            You provide services on the CTS Go platform as an independent contractor, not as
            an employee, agent, or partner of CTS. Nothing in this Agreement creates an employment
            relationship. You control how and when you work, decide which requests to accept, and are
            responsible for your own vehicle, equipment, and operating costs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">2. Eligibility and Onboarding</h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>You must be at least 18 years of age.</li>
            <li>You must complete account setup, including a live identity photo, and accept these terms.</li>
            <li>You must submit the required identification and vehicle documents for review.</li>
            <li>You may only begin accepting jobs after your account has been reviewed and approved by CTS.</li>
            <li>You must keep your documents, licence, and vehicle information valid and up to date.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">3. Providing Services</h2>
          <p className="text-gray-700">
            When you are online and accept a request, you agree to carry out the ride, delivery, or
            gas order safely, promptly, and professionally. You are responsible for operating in
            compliance with all applicable Ghanaian traffic and transport laws, maintaining valid
            insurance and a roadworthy vehicle, and treating passengers and customers with respect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Wallet className="h-5 w-5" /> 4. Earnings and Platform Commission
          </h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>You earn the fare or delivery fee for each completed job, less the CTS platform commission.</li>
            <li>CTS charges a platform commission on each completed job. The current commission rate is made available to you in the app and may be updated from time to time with notice.</li>
            <li>Your earnings, commission, and balances are recorded in your in-app driver wallet.</li>
            <li>You are responsible for your own income taxes and any statutory obligations arising from your earnings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">5. Payment Methods and Cash Jobs</h2>
          <p className="text-gray-700 mb-2">
            Passengers and customers may pay by in-app wallet, mobile money, or cash:
          </p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>For wallet and mobile money payments, your net earnings (after commission) are credited to your driver wallet.</li>
            <li>For cash jobs, you collect the fare directly from the customer. The platform commission on those jobs is recorded as an amount owed and is settled from your wallet balance or from future earnings.</li>
            <li>You agree that CTS may deduct outstanding commission owed from your wallet balance and from payouts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">6. Payouts and Withdrawals</h2>
          <p className="text-gray-700">
            You may withdraw your available wallet balance through the payout options provided in the
            app, subject to any minimum amounts, verification, and processing times. Payouts are made
            to your registered mobile money account. Any commission owed is settled at the time of
            withdrawal. CTS is not responsible for delays caused by payment providers or by incorrect
            payout details you provide.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">7. Ratings and Service Standards</h2>
          <p className="text-gray-700">
            Passengers and customers may rate your service. Consistently low ratings, repeated
            cancellations, no-shows, or verified complaints may lead to warnings, temporary
            suspension, or removal from the platform. You may also rate your experience, and we
            encourage you to report any safety or conduct concerns.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">8. Prohibited Conduct</h2>
          <p className="text-gray-700 mb-2">You agree not to:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Provide false information or use another person&apos;s account or documents.</li>
            <li>Accept jobs you are not licensed, insured, or fit to perform.</li>
            <li>Manipulate fares, ratings, incentives, or the commission system.</li>
            <li>Carry out illegal activities or transport prohibited goods through the platform.</li>
            <li>Behave unsafely, abusively, or dishonestly towards passengers, customers, or CTS.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">9. Safety and Location Data</h2>
          <p className="text-gray-700">
            When you are online, CTS collects your location to match you with nearby requests, enable
            live tracking for passengers and customers, and support safety. You agree to keep location
            services enabled while providing services. Handling of your data is described in our
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> 10. Liability and Insurance
          </h2>
          <p className="text-gray-700">
            You are responsible for maintaining valid insurance for your vehicle and operations. CTS
            provides the technology platform and is not a transport carrier or insurer. To the fullest
            extent permitted by law, CTS is not liable for loss, damage, injury, or claims arising
            from your provision of services or your use of the platform. Nothing in this Agreement
            excludes liability that cannot be excluded under Ghanaian law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">11. Suspension and Termination</h2>
          <p className="text-gray-700">
            CTS may suspend or deactivate your driver account, with or without notice, if you breach
            this Agreement, provide false information, fall below service standards, or engage in
            conduct that may harm CTS, users, or the public. You may stop providing services at any
            time and request account deletion through the app. Any commission owed remains payable on
            termination, and any remaining available balance is subject to our payout process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">12. Changes to This Agreement</h2>
          <p className="text-gray-700">
            We may update this Agreement from time to time, including commission rates and payout
            terms. Changes will be posted on this page with an updated effective date and, where
            significant, notified to you in the app. Your continued use of the platform after changes
            are posted constitutes acceptance of the revised Agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">13. Governing Law</h2>
          <p className="text-gray-700">
            This Agreement is governed by and construed in accordance with the laws of the Republic of
            Ghana. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ghana.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">14. Contact Us</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-2">
              For any questions regarding this Driver &amp; Rider Agreement, please contact us:
            </p>
            <div className="mt-3">
              <p className="text-gray-800">
                <strong>CTS Go</strong>
                <br />
                Email:{" "}
                <a
                  href="mailto:ctsofficial716@gmail.com"
                  className="text-emerald-600 hover:underline"
                >
                  ctsofficial716@gmail.com
                </a>
                <br />
                Phone:{" "}
                <a href="tel:+233555994787" className="text-emerald-600 hover:underline">
                  +233 555 994 787
                </a>
                <br />
                Office:{" "}
                <a href="tel:0307031166" className="text-emerald-600 hover:underline">
                  030 703 1166
                </a>
                <br />
                Location: Greater Accra, Ghana
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} CTS Go. All rights reserved.
        </p>
        <div className="flex gap-3">
          
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors text-sm"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
};

export default DriverAgreementPage;