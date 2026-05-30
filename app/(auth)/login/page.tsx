'use strict';

import LoginFormClient from './login-form-client';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-xl border border-border shadow-sm">
        {/* Logo / Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">
            PeerPrep
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Practice like it's real. Learn from peers who've been there.
          </p>
          <h2 className="mt-6 text-xl font-bold text-text-primary tracking-tight">
            Log in to your account
          </h2>
        </div>

        {/* Client side login form */}
        <LoginFormClient />
      </div>
    </main>
  );
}
