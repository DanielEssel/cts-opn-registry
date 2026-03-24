"use client";

import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <main className="max-w-5xl mx-auto p-8 font-sans text-gray-800">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Privacy Policy</h1>

      <p className="mb-4">Effective Date: 24 March 2026</p>

      <p className="mb-6">
        CTS Africa (“we,” “our,” or “us”) respects your privacy and is committed to protecting your personal information. 
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
        or use our services, in compliance with the <strong>Data Protection Act 2012 (Act 843)</strong> of Ghana.
      </p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">1. Information We Collect</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>Full Name, Date of Birth, Gender</li>
          <li>Contact details such as Phone Number and Email Address</li>
          <li>Identification details including ID Type and ID Number</li>
          <li>Residential and location details</li>
          <li>Vehicle information (if applicable)</li>
          <li>Next of Kin details</li>
          <li>Any other information provided voluntarily</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>To provide and manage our services</li>
          <li>To verify identity and eligibility</li>
          <li>To improve our website, products, and services</li>
          <li>To communicate important updates and notifications</li>
          <li>To comply with legal obligations under Ghanaian law</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">3. Legal Basis for Processing</h2>
        <p>
          We process personal data based on your consent, to fulfill a contract, or to comply with legal obligations under the 
          <strong> Data Protection Act 2012 (Act 843)</strong>.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">4. Sharing of Information</h2>
        <p>
          Personal data may be shared with:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Authorized employees for business purposes</li>
          <li>Third-party service providers under contract</li>
          <li>Regulatory authorities as required by law</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">5. Data Security</h2>
        <p>
          We implement technical, administrative, and physical safeguards to protect your personal data. 
          All personal data is stored securely, and access is limited to authorized personnel only.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">6. Data Retention</h2>
        <p>
          Personal data is retained only for as long as necessary to fulfill the purposes outlined in this Privacy Policy 
          or as required by law.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">7. Your Rights</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>Access, update, or request correction of your personal data</li>
          <li>Request deletion of your personal data where applicable</li>
          <li>Withdraw consent at any time where processing is based on consent</li>
          <li>File a complaint with the Ghana Data Protection Commission</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">8. International Transfers</h2>
        <p>
          We do not transfer personal data outside Ghana except where necessary for services and with adequate safeguards 
          in place to protect your information in compliance with Ghanaian law.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">9. Contact Us</h2>
        <p>
          For any questions regarding this Privacy Policy or our data practices, please contact us:
        </p>
        <p className="mt-2">
          CTS Africa<br />
          Email: <a href="mailto:ctsofficical716@gmail.com" className="text-green-700 underline">ctsofficial716@gmail.com</a><br />
          Phone: +233 244 267 329
        </p>
      </section>

      <p className="mt-10 text-sm text-gray-500">
        © 2026 CTS Africa. All rights reserved.
      </p>
    </main>
  );
};

export default PrivacyPolicyPage;