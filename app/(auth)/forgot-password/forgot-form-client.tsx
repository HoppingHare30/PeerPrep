'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ForgotFormClient() {
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Sending reset link...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Password reset link sent! Check your email.', { id: toastId });
        setIsSent(true);
      }
    } catch (err) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-green-tint p-4 rounded-lg border border-border text-sm text-text-primary">
          A password reset link has been sent to <span className="font-semibold">{email}</span>. Please click on the link in the email to set a new password.
        </div>
        <div>
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-border rounded-md bg-surface text-sm font-medium text-text-primary hover:bg-orange-tint transition duration-150"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleReset}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
          Institutional Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@iitr.ac.in"
          className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition duration-150"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition duration-150 cursor-pointer"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </div>

      <div className="text-center text-sm">
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
