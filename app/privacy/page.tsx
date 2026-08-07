"use client";

import Link from "next/link";
import { ArrowLeft, Shield, FileText, Lock} from "lucide-react";

const CTSPrivacyPolicyPage = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 font-sans text-gray-800">
      {/* Back Button */}
    

      {/* Header with Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-700">Privacy Policy</h1>
      </div>

      <p className="mb-4 text-sm text-gray-500">Effective Date: 24 March 2026</p>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl">
        <p className="text-sm text-amber-800">
          <strong>📢 Data Protection Notice:</strong> CTS Transport is committed to protecting your
          personal information in compliance with the{" "}
          <strong>Data Protection Act 2012 (Act 843)</strong> of Ghana. Your data is collected,
          processed, and stored securely, and used only for the purposes described below.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> 1. Who We Are
          </h2>
          <p className="text-gray-700">
            CTS Transport (&quot;CTS&quot;, &quot;we&quot;, &quot;us&quot;) operates a technology
            platform connecting passengers and customers with independent drivers and riders for
            on-demand rides, parcel delivery, and LPG gas delivery in Ghana. This Privacy Policy
            explains how we collect, use, and protect your personal data when you use our passenger
            and driver applications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> 2. Information We Collect
          </h2>
          <p className="text-gray-700 mb-2">
            Depending on whether you use the app as a passenger/customer or as a driver/rider, we may
            collect:
          </p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Account details such as your name and phone number.</li>
            <li>Verification data, including one-time passwords (OTP) sent to your phone.</li>
            <li>Location data — pickup, drop-off, and, for drivers, live location while you are online.</li>
            <li>Trip, delivery, and gas order details, including addresses and receiver contact details you provide.</li>
            <li>Payment information such as wallet balances and mobile money details (full card details are handled by our payment providers, not stored by us).</li>
            <li>For drivers and riders: identification documents, a live profile photo, and vehicle information submitted for verification.</li>
            <li>Device and usage information, and communications with our support team.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Lock className="h-5 w-5" /> 3. How We Use Your Information
          </h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>To create and manage your account and verify your identity.</li>
            <li>To match passengers and customers with nearby drivers and riders.</li>
            <li>To enable live tracking, navigation, and completion of rides, deliveries, and gas orders.</li>
            <li>To process payments, wallet transactions, driver earnings, and commission.</li>
            <li>To send you trip updates, receipts, and important service notifications.</li>
            <li>To support safety, prevent fraud, and investigate incidents or complaints.</li>
            <li>To improve our services and comply with legal obligations under Ghanaian law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">4. Location Data</h2>
          <p className="text-gray-700">
            Location is central to our services. For passengers and customers, we use location to set
            pickup and drop-off points and to show your driver&apos;s progress. For drivers and
            riders, we collect location while you are online to match you with nearby requests and to
            provide live tracking to customers. You can control location permissions through your
            device settings, but disabling location will limit or prevent use of the services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">5. Legal Basis for Processing</h2>
          <p className="text-gray-700">
            We process your personal data based on your consent (provided when you create an account),
            to perform our contract with you (providing the services you request), and to comply with
            legal obligations under the <strong>Data Protection Act 2012 (Act 843)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">6. Sharing of Information</h2>
          <p className="text-gray-700 mb-2">Your data may be shared with:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Drivers, riders, passengers, and customers — limited details needed to complete a trip, delivery, or order (such as name, pickup/drop-off, and contact for coordination).</li>
            <li>Third-party payment providers to process mobile money and card payments and driver payouts.</li>
            <li>Service providers who support our platform (such as cloud hosting, mapping, and messaging), under confidentiality obligations.</li>
            <li>Regulatory or law enforcement authorities where required by law.</li>
          </ul>
          <p className="text-gray-700 mt-2">We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">7. Data Security</h2>
          <p className="text-gray-700">
            We implement technical, administrative, and physical safeguards to protect your personal
            data. Data is stored securely using recognized cloud infrastructure, access is limited to
            authorized personnel, and sensitive information such as payment credentials is handled by
            our payment providers rather than stored on our systems.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">8. Data Retention</h2>
          <p className="text-gray-700">
            We retain your personal data for as long as your account is active and as needed to
            provide the services, resolve disputes, meet legal and tax obligations, and prevent
            fraud. When you delete your account, we remove or anonymize your personal data, except
            where we are required to retain certain records by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">9. Your Rights</h2>
          <p className="text-gray-700 mb-2">
            Under Ghana&apos;s Data Protection Act 2012 (Act 843), you have the right to:
          </p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Access, update, or request correction of your personal data.</li>
            <li>Request deletion of your account and personal data, which you can start from within the app.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Object to or request restriction of certain processing.</li>
            <li>File a complaint with the Ghana Data Protection Commission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">10. Account Deletion</h2>
          <p className="text-gray-700">
            You can request deletion of your account from within the app. When you do, we begin
            closing your account and removing your personal data. Some information may be retained
            where required for legal, tax, safety, or fraud-prevention purposes, and outstanding
            balances or amounts owed may need to be settled before deletion is completed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">11. International Transfers</h2>
          <p className="text-gray-700">
            Some of our service providers (such as cloud hosting and payment processing) may store or
            process data outside Ghana. Where this happens, we take steps to ensure your data is
            protected with adequate safeguards in compliance with Ghanaian law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">12. Children</h2>
          <p className="text-gray-700">
            Our services are not intended for anyone under 18 years of age. We do not knowingly
            collect personal data from children. If you believe a minor has provided us with personal
            data, please contact us so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">13. Updates to This Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated effective date, and where significant, notified to you in the app. We
            encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">14. Contact Us</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-2">
              For any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3">
              <p className="text-gray-800">
                <strong>CTS Transport</strong>
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
          © {new Date().getFullYear()} CTS Transport. All rights reserved.
        </p>
        <div className="flex gap-3">
         
          <Link
            href="/terms"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors text-sm"
          >
            Terms of Service
          </Link>
          <Link
            href="/driver-agreement"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Driver Agreement
          </Link>
        </div>
      </div>
    </main>
  );
};

export default CTSPrivacyPolicyPage;