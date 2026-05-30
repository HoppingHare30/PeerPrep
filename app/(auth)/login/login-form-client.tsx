'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginFormClient() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Logging in...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Logged in successfully!', { id: toastId });
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred during login.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const toastId = toast.loading('Connecting to Google...');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message, { id: toastId });
        setIsGoogleLoading(false);
      }
    } catch (err) {
      toast.error('Could not initiate Google login.', { id: toastId });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
            Institutional Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading || isGoogleLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., student@iitr.ac.in"
            className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition duration-150"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading || isGoogleLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition duration-150"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition duration-150 cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-text-secondary">Or continue with</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          disabled={isLoading || isGoogleLoading}
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-2 px-4 border border-border rounded-md bg-surface text-sm font-medium text-text-primary hover:bg-orange-tint transition duration-150 cursor-pointer"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-text-secondary">New to PeerPrep? </span>
        <Link
          href="/signup"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
