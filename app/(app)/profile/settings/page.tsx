'use strict';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch the full public profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, name, graduation_year, skills, resume_url, availability')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Fetch the existing user_companies mappings
  const { data: companyRoles } = await supabase
    .from('user_companies')
    .select(`
      id,
      role,
      type,
      company_id,
      companies (
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
          Profile Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Update your basic profile info, skills, resume, and manage your company preferences.
        </p>
      </div>

      <SettingsClient
        userId={user.id}
        initialProfile={{
          name: profile.name,
          graduationYear: profile.graduation_year || 2026,
          skills: profile.skills || [],
          resumeUrl: profile.resume_url || '',
          availability: profile.availability ?? true,
        }}
        initialCompanyRoles={companyRoles || []}
      />
    </main>
  );
}
