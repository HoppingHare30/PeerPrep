import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SessionWorkspaceClient from './session-workspace-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/session/${id}`);
  }

  // 2. Fetch the session details with interviewee, interviewer and company relations
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      interviewee:interviewee_id (id, name, email, college, graduation_year, resume_url),
      interviewer:interviewer_id (id, name, email, college, graduation_year),
      company:company_id (id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !session) {
    console.error('Session not found or query error:', error);
    redirect('/sessions');
  }

  // 3. Verify that the authenticated user is a participant of the session
  const isInterviewee = session.interviewee_id === user.id;
  const isInterviewer = session.interviewer_id === user.id;

  if (!isInterviewee && !isInterviewer) {
    redirect('/sessions');
  }

  return (
    <SessionWorkspaceClient
      session={session}
      currentUserId={user.id}
      isInterviewer={isInterviewer}
    />
  );
}
