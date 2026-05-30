'use strict';

import VerifyClient from './verify-client';

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-xl border border-border shadow-sm text-center">
        {/* Logo / Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">
            PeerPrep
          </h1>
          <div className="mt-6 flex justify-center">
            <div className="bg-orange-tint p-3 rounded-full text-primary">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5"
                />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-text-primary tracking-tight">
            Check your email
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            We have sent a verification link to your institutional email address.
            Please click on the link in that email to activate your account.
          </p>
        </div>

        <VerifyClient />
      </div>
    </main>
  );
}
