'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      toast.error('Could not find email address. Please try logging in.');
      return;
    }

    setIsResending(true);
    const toastId = toast.loading('Resending verification email...');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Verification email resent successfully!', { id: toastId });
        setCountdown(60); // 60s throttle limit
      }
    } catch (err) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {email && (
        <div className="bg-orange-tint p-3 rounded-lg border border-border text-sm text-text-primary">
          Sent to: <span className="font-semibold">{email}</span>
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          disabled={isResending || countdown > 0 || !email}
          onClick={handleResend}
          className="w-full flex justify-center py-2 px-4 border border-border rounded-md bg-surface text-sm font-medium text-text-primary hover:bg-orange-tint disabled:opacity-50 transition duration-150 cursor-pointer"
        >
          {isResending
            ? 'Resending...'
            : countdown > 0
            ? `Resend available in ${countdown}s`
            : 'Resend Verification Email'}
        </button>

        <div className="flex flex-col gap-2 text-sm text-center">
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyClient() {
  return (
    <Suspense fallback={<div className="text-text-secondary text-sm">Loading verification details...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
