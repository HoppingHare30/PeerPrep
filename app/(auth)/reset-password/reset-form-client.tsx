'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ResetFormClient() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Updating password...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.success('Password updated successfully!', { id: toastId });
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpdate}>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition duration-150"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          disabled={isLoading}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 block w-full px-3 py-2 bg-surface border border-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition duration-150"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition duration-150 cursor-pointer"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
