'use strict';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './onboarding-client';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch their current profile to pre-fill their name
  const { data: profile } = await supabase
    .from('users')
    .select('name, onboarding_complete')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_complete) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-xl w-full bg-surface p-8 sm:p-10 rounded-xl border border-border shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">
            Welcome to PeerPrep
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Let's customize your mock interview experience.
          </p>
        </div>

        {/* Multi-step Onboarding Client */}
        <OnboardingClient initialName={profile?.name || user.user_metadata?.name || ''} userId={user.id} />
      </div>
    </main>
  );
}
