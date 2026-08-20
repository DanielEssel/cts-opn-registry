"use client";


import Link from "next/link";
import {
  UserX,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Mail
} from "lucide-react";

const DeleteAccountPage = () => {
  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 font-sans text-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <UserX className="h-5 w-5 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-emerald-700">
          CTS Go Account Deletion
        </h1>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        Effective Date: 20 August 2026
      </p>

      {/* Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-xl">
        <p className="text-sm text-amber-800">
          <strong>Account deletion request:</strong> If you no longer wish to
          use CTS Go, you can request deletion of your CTS Go account and
          associated personal data using the instructions below.
        </p>
      </div>

      <div className="space-y-8">
        {/* How to request deletion */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            1. How to Request Account Deletion
          </h2>

          <p className="text-gray-700 mb-4">
            To request deletion of your CTS Go account, send an account
            deletion request to our support team using the email address below.
            Please send the request from the email address associated with your
            CTS Go account whenever possible.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-gray-700 mb-2 font-medium">
              Account deletion email:
            </p>

            <a
              href="mailto:ctsofficial716@gmail.com?subject=CTS%20Go%20Account%20Deletion%20Request"
              className="inline-flex items-center gap-2 text-emerald-600 hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              ctsofficial716@gmail.com
            </a>

            <p className="text-sm text-gray-500 mt-3">
              Subject: CTS Go Account Deletion Request
            </p>
          </div>
        </section>

        {/* Information to provide */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            2. Information to Include
          </h2>

          <p className="text-gray-700 mb-3">
            To help us identify your account and process your request, please
            include:
          </p>

          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Your full name</li>
            <li>The phone number or email address registered with CTS Go</li>
            <li>Whether you use the CTS Go Passenger or Driver app</li>
            <li>
              A clear statement that you want your CTS Go account deleted
            </li>
          </ul>
        </section>

        {/* What gets deleted */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            3. Data That Will Be Deleted
          </h2>

          <p className="text-gray-700 mb-3">
            After your request has been verified and processed, we will delete
            or remove personal information associated with your CTS Go account
            where applicable.
          </p>

          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Account and profile information</li>
            <li>Personal contact information</li>
            <li>Profile information and uploaded account documents where applicable</li>
            <li>Saved account preferences</li>
            <li>Other personal information associated with your account where deletion is legally permitted</li>
          </ul>
        </section>

        {/* Data that may be retained */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            4. Information That May Be Retained
          </h2>

          <p className="text-gray-700 mb-3">
            Some information may need to be retained for a limited period when
            required for legitimate business, legal, security, fraud
            prevention, accounting, or regulatory purposes.
          </p>

          <p className="text-gray-700">
            Where information must be retained, it will be kept only for the
            period required for the applicable purpose or legal obligation and
            will not be retained indefinitely solely because you deleted your
            account.
          </p>
        </section>

        {/* Financial transactions */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            5. Financial and Transaction Records
          </h2>

          <p className="text-gray-700">
            Account deletion does not necessarily remove transaction,
            payment, wallet, trip, delivery, or financial records that CTS is
            required to retain for accounting, dispute resolution, fraud
            prevention, legal, or regulatory purposes.
          </p>
        </section>

        {/* Processing */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            6. Processing Your Request
          </h2>

          <p className="text-gray-700">
            We may contact you to verify ownership of the account before
            processing the deletion request. Once verified, CTS will process
            the request within a reasonable period, subject to applicable
            legal and operational requirements.
          </p>
        </section>

        {/* Important */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            7. Important Information
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>Account deletion is permanent once completed.</li>
              <li>
                You may lose access to your CTS Go account and associated
                services.
              </li>
              <li>
                Any outstanding financial obligations may remain payable after
                an account deletion request.
              </li>
              <li>
                Deleting your account does not cancel obligations that arose
                before deletion.
              </li>
              <li>
                Information required to comply with applicable laws or resolve
                disputes may be retained as described above.
              </li>
            </ul>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            8. Privacy Policy
          </h2>

          <p className="text-gray-700">
            For more information about how CTS Go collects, uses, stores, and
            protects personal information, please review our Privacy Policy.
          </p>

          <div className="mt-4">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              View Privacy Policy
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3">
            9. Contact Us
          </h2>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-3">
              If you have questions about account deletion or your personal
              data, please contact us:
            </p>

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
              <a
                href="tel:+233555994787"
                className="text-emerald-600 hover:underline"
              >
                +233 555 994 787
              </a>
              <br />

              Office:{" "}
              <a
                href="tel:0307031166"
                className="text-emerald-600 hover:underline"
              >
                030 703 1166
              </a>
              <br />

              Location: Greater Accra, Ghana
            </p>
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

export default DeleteAccountPage;