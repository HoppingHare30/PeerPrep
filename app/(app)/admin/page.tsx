import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './admin-client';

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Authenticate and check if user is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // 2. Fetch all registered users in public.users
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (usersErr) {
    console.error('Admin page failed to fetch users:', usersErr);
  }

  // 3. Fetch session analytics count
  const { count: sessionCount, error: sessionErr } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });

  if (sessionErr) {
    console.error('Admin page failed to count sessions:', sessionErr);
  }

  // 4. Fetch feedback analytics count
  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-sans">
          PeerPrep Administration
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Monitor campus enrollment activity, manage user directories, and audit platform settings.
        </p>
      </div>

      <AdminClient
        initialUsers={users || []}
        sessionCount={sessionCount || 0}
        feedbackCount={feedbackCount || 0}
        currentAdminId={user.id}
      />
    </div>
  );
}
