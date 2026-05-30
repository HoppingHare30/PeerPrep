'use strict';

import ForgotFormClient from './forgot-form-client';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-xl border border-border shadow-sm">
        {/* Logo / Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">
            PeerPrep
          </h1>
          <h2 className="mt-6 text-xl font-bold text-text-primary tracking-tight">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your institutional email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Client side forgot password form */}
        <ForgotFormClient />
      </div>
    </main>
  );
}
