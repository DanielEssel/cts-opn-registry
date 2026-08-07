"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Scale, AlertTriangle } from "lucide-react";

const TermsOfUsePage = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 font-sans text-gray-800">

      {/* Header with Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Scale className="h-5 w-5 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-700">Terms of Service</h1>
      </div>

      <p className="mb-4 text-sm text-gray-500">Effective Date: 24 March 2026</p>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl">
        <p className="text-sm text-amber-800">
          <strong>📋 Agreement Notice:</strong> By creating an account or using the CTS Transport
          apps, you agree to these Terms of Service. Please read them carefully. If you do not agree,
          please do not use our services.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> 1. About CTS Transport
          </h2>
          <p className="text-gray-700">
            CTS Transport (&quot;CTS&quot;, &quot;we&quot;, &quot;us&quot;) operates a technology
            platform that connects passengers and customers with independent drivers and riders for
            on-demand transport, parcel delivery, and LPG gas delivery services within Ghana. CTS
            provides the platform that facilitates these connections; the transport, delivery, and
            gas services themselves are provided by independent drivers and riders.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">2. Acceptance of Terms</h2>
          <p className="text-gray-700">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the CTS
            Transport passenger and driver applications and related services. By creating an account
            or using the apps, you confirm that you have read, understood, and agree to be bound by
            these Terms and our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">3. Eligibility</h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>You must be at least 18 years of age to create an account and use our services.</li>
            <li>You must provide accurate, current, and complete information when registering.</li>
            <li>
              Drivers and riders must hold a valid licence and any permits required to operate a
              commercial vehicle in Ghana, and must complete our verification requirements.
            </li>
            <li>You are responsible for keeping your account information up to date.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">4. Accounts and Verification</h2>
          <p className="text-gray-700">
            You are responsible for maintaining the confidentiality of your account and for all
            activity that occurs under it. Verification is by one-time password (OTP) sent to your
            registered phone number. Drivers must submit the required identification and vehicle
            documents for review before being approved to accept jobs. CTS may suspend or terminate
            accounts that contain false information or are used in breach of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">5. Services</h2>
          <p className="text-gray-700 mb-2">Through the CTS platform you may request:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li><strong>Rides</strong> — on-demand passenger transport.</li>
            <li><strong>Delivery</strong> — sending parcels and goods between locations.</li>
            <li><strong>Gas</strong> — ordering and delivery of LPG gas refills.</li>
          </ul>
          <p className="text-gray-700 mt-2">
            Availability of drivers, riders, and services depends on your location and demand, and is
            not guaranteed at all times.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">6. Fares, Fees and Payments</h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Fares and delivery fees are calculated based on factors such as distance, service type, and applicable charges, and are shown before you confirm a request where possible.</li>
            <li>Payments may be made by in-app wallet, mobile money, or cash, depending on the service and options available.</li>
            <li>All amounts are in Ghana Cedis (GHS).</li>
            <li>Mobile money and card payments are processed by authorized third-party payment providers; CTS does not store your full payment card details.</li>
            <li>CTS charges drivers and riders a service commission on completed jobs, which is deducted or settled in accordance with the driver terms in effect.</li>
            <li>Except where required by law or expressly stated, completed-trip fares are non-refundable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">7. Cancellations</h2>
          <p className="text-gray-700">
            You may cancel a request before it is accepted or completed, subject to any cancellation
            policy in effect. A cancellation fee may apply where a driver or rider has already been
            dispatched or has travelled towards the pickup point. Repeated cancellations or no-shows
            may result in restrictions on your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">8. User Conduct</h2>
          <p className="text-gray-700 mb-2">You agree not to:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Provide false, misleading, or fraudulent information.</li>
            <li>Use the platform for any unlawful purpose or to transport prohibited or illegal goods.</li>
            <li>Behave abusively, threateningly, or unsafely towards drivers, riders, passengers, or CTS staff.</li>
            <li>Impersonate another person or use another user&apos;s account without authorization.</li>
            <li>Attempt to gain unauthorized access to, interfere with, or disrupt the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">9. Driver and Rider Responsibilities</h2>
          <p className="text-gray-700">
            Drivers and riders are independent providers and are responsible for operating safely and
            lawfully, maintaining valid licences, permits, insurance, and roadworthy vehicles, and
            complying with all applicable Ghanaian traffic and transport laws. Drivers and riders are
            responsible for their own tax obligations arising from their earnings on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">10. Safety</h2>
          <p className="text-gray-700">
            CTS is committed to the safety of everyone who uses the platform. We may collect location
            data during trips, verify driver identity, and provide in-app tools to support safety.
            However, CTS does not control the conduct of drivers, riders, or passengers, and you use
            the services at your own risk. Report any safety concern to us promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">11. Intellectual Property</h2>
          <p className="text-gray-700">
            All content in the CTS apps, including logos, text, graphics, and software, is the
            property of CTS or its licensors and is protected by applicable intellectual property
            laws. You may not copy, reproduce, or distribute any part of the apps without prior
            written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> 12. Limitation of Liability
          </h2>
          <p className="text-gray-700">
            The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. CTS
            provides a technology platform connecting users with independent drivers and riders and
            is not a transport carrier. To the fullest extent permitted by law, CTS shall not be
            liable for any indirect, incidental, or consequential damages arising from your use of, or
            inability to use, the platform, or from the acts or omissions of any driver, rider, or
            user. Nothing in these Terms excludes liability that cannot be excluded under Ghanaian law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">13. Suspension and Termination</h2>
          <p className="text-gray-700">
            CTS may suspend or terminate your access to the platform, with or without notice, if you
            breach these Terms, provide inaccurate information, or engage in conduct that may harm
            CTS, other users, or the public. You may stop using the services and request deletion of
            your account at any time through the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">14. Governing Law</h2>
          <p className="text-gray-700">
            These Terms are governed by and construed in accordance with the laws of the Republic of
            Ghana. Any disputes arising from these Terms shall be subject to the exclusive
            jurisdiction of the courts of Ghana.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">15. Changes to These Terms</h2>
          <p className="text-gray-700">
            We may update these Terms from time to time. Any changes will be posted on this page with
            an updated effective date. Your continued use of the apps after changes are posted
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">16. Contact Us</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-2">
              For any questions regarding these Terms of Service, please contact us:
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

export default TermsOfUsePage;