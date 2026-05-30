'use strict';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SearchClient from './search-client';

export default async function SearchPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch logged in user's college
  const { data: profile } = await supabase
    .from('users')
    .select('college')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
          Find Peer Interviewers
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Search and connect with peers from <span className="font-semibold text-primary">{profile.college}</span> for mock interview practice.
        </p>
      </div>

      <SearchClient currentUserId={user.id} currentUserCollege={profile.college} />
    </div>
  );
}
