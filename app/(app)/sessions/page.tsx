'use strict';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SessionsClient from './sessions-client';

export default async function SessionsPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch all sessions where the user is either interviewee OR interviewer
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      interviewee:interviewee_id (id, name, college, graduation_year, resume_url),
      interviewer:interviewer_id (id, name, college, graduation_year),
      company:company_id (id, name, slug),
      feedback:feedback(*)
    `)
    .or(`interviewee_id.eq.${user.id},interviewer_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sessions:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
          My Mock Sessions
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Review, accept, schedule, and enter your peer mock interview sessions here.
        </p>
      </div>

      <SessionsClient initialSessions={sessions || []} currentUserId={user.id} />
    </div>
  );
}
