import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';
import Header from '@/components/layout/header';
import NotificationBell from '@/components/layout/notification-bell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch the full public profile for sidebar display
  const { data: profile } = await supabase
    .from('users')
    .select('name, college, availability, role')
    .eq('id', user.id)
    .single();

  const userName = profile?.name || user.user_metadata?.name || 'PeerPrep User';
  const userCollege = profile?.college || 'Student';
  const userRole = profile?.role || 'user';
  const availability = profile?.availability ?? true;

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-200">
      {/* 1. Mobile Header (hidden on desktop) */}
      <Header />

      {/* 2. Desktop Sidebar (hidden on mobile) */}
      <Sidebar
        userId={user.id}
        userName={userName}
        userCollege={userCollege}
        userRole={userRole}
        initialAvailability={availability}
      />

      {/* Desktop-only notification bar helper in top-right */}
      <div className="absolute top-4 right-6 hidden lg:flex items-center space-x-4 z-30">
        <NotificationBell />
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col lg:pl-60 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNav userId={user.id} />
    </div>
  );
}
