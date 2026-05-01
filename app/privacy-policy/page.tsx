"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, Lock, Home } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 font-sans text-gray-800">
      {/* Back to Register Button */}
      <div className="mb-6">
        <Link
          href="/pre-register"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Registration
        </Link>
      </div>

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
          <strong>📢 Data Protection Notice:</strong> CTS Africa is committed to protecting your personal information 
          in compliance with the <strong>Data Protection Act 2012 (Act 843)</strong> of Ghana. Your data is collected, 
          processed, and stored securely.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> 1. Information We Collect
          </h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Full Name, Date of Birth, Gender</li>
            <li>Contact details such as Phone Number and Email Address</li>
            <li>Identification details including ID Type and ID Number</li>
            <li>Residential and location details</li>
            <li>Vehicle information (if applicable)</li>
            <li>Next of Kin details</li>
            <li>Passport photograph</li>
            <li>Any other information provided voluntarily</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Lock className="h-5 w-5" /> 2. How We Use Your Information
          </h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>To provide and manage our training registration services</li>
            <li>To verify identity and eligibility for commercial rider training</li>
            <li>To generate and issue Rider Identification Numbers (RIN)</li>
            <li>To improve our website, products, and services</li>
            <li>To communicate important updates, training schedules, and notifications</li>
            <li>To comply with legal obligations under Ghanaian law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">3. Legal Basis for Processing</h2>
          <p className="text-gray-700">
            We process personal data based on your explicit consent (provided during registration), 
            to fulfill a contract (training registration), or to comply with legal obligations under the 
            <strong> Data Protection Act 2012 (Act 843)</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">4. Sharing of Information</h2>
          <p className="text-gray-700 mb-2">
            Personal data may be shared with:
          </p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Authorized CTS Africa employees for business purposes</li>
            <li>Third-party payment processors (PayStack) for fee collection</li>
            <li>Regulatory authorities as required by law</li>
            <li>Training partners and certification bodies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">5. Data Security</h2>
          <p className="text-gray-700">
            We implement technical, administrative, and physical safeguards to protect your personal data. 
            All personal data is stored securely using encryption, and access is limited to authorized personnel only. 
            Our systems undergo regular security audits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">6. Data Retention</h2>
          <p className="text-gray-700">
            Personal data is retained only for as long as necessary to fulfill the purposes outlined in this Privacy Policy 
            or as required by law. Registration records are retained for a minimum of 5 years for audit and verification purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">7. Your Rights</h2>
          <p className="text-gray-700 mb-2">Under Ghana's Data Protection Act 2012 (Act 843), you have the right to:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Access, update, or request correction of your personal data</li>
            <li>Request deletion of your personal data where applicable</li>
            <li>Withdraw consent at any time where processing is based on consent</li>
            <li>Request data portability</li>
            <li>File a complaint with the Ghana Data Protection Commission</li>
            <li>Object to processing of your personal data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">8. Cookies and Tracking</h2>
          <p className="text-gray-700">
            Our website uses cookies to enhance user experience and analyze site traffic. 
            You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">9. International Transfers</h2>
          <p className="text-gray-700">
            We do not transfer personal data outside Ghana except where necessary for payment processing services. 
            Any such transfers are conducted with adequate safeguards in place to protect your information in compliance with Ghanaian law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">10. Updates to This Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated 
            effective date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">11. Contact Us</h2>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-2">
              For any questions regarding this Privacy Policy or our data practices, please contact our Data Protection Officer:
            </p>
            <div className="mt-3">
              <p className="text-gray-800">
                <strong>CTS Africa</strong><br />
                Email: <a href="mailto:ctsofficical716@gmail.com" className="text-emerald-600 hover:underline">ctsofficial716@gmail.com</a><br />
                Phone: <a href="tel:+233244267329" className="text-emerald-600 hover:underline">+233 244 267 329</a><br />
                Location: Greater Accra, Ghana
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with Back Button */}
      <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} CTS Africa. All rights reserved.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/pre-register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registration
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;