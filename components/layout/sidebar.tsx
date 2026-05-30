'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Home,
  Search,
  Calendar,
  User,
  Settings,
  Shield,
  LogOut,
  Power
} from 'lucide-react';
import { toast } from 'sonner';

interface SidebarProps {
  userId: string;
  userName: string;
  userCollege: string;
  userRole: string;
  initialAvailability: boolean;
}

export default function Sidebar({
  userId,
  userName,
  userCollege,
  userRole,
  initialAvailability
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [availability, setAvailability] = useState(initialAvailability);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleAvailability = async () => {
    setIsToggling(true);
    const newStatus = !availability;
    setAvailability(newStatus); // Optimistic update

    try {
      const { error } = await supabase
        .from('users')
        .update({ availability: newStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(newStatus ? 'You are now visible to peers!' : 'You are now hidden from search.');
    } catch (err) {
      setAvailability(!newStatus); // Rollback
      toast.error('Failed to update availability.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSignOut = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully.', { id: toastId });
      router.refresh();
      router.push('/login');
    } catch (err) {
      toast.error('Failed to sign out.', { id: toastId });
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/search', label: 'Search Peers', icon: Search },
    { href: '/sessions', label: 'My Sessions', icon: Calendar },
    { href: `/profile/${userId}`, label: 'My Profile', icon: User },
    { href: '/profile/settings', label: 'Settings', icon: Settings },
  ];

  if (userRole === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <aside className="w-60 bg-surface border-r border-border h-screen flex flex-col justify-between fixed left-0 top-0 hidden lg:flex z-40 transition-colors duration-200">
      {/* Top Section */}
      <div className="space-y-8 py-6">
        {/* Logo */}
        <div className="px-6 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-extrabold text-primary tracking-tight">
            PeerPrep
          </Link>
        </div>

        {/* Availability Card */}
        <div className="px-4">
          <div className="bg-orange-tint p-4 rounded-xl border border-border flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-text-primary block">Availability</span>
              <span className={`text-[10px] font-bold ${availability ? 'text-secondary' : 'text-text-secondary'}`}>
                {availability ? 'VISIBLE (ON)' : 'HIDDEN (OFF)'}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`p-2 rounded-full transition duration-150 cursor-pointer ${
                availability 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'bg-surface border border-border text-text-secondary'
              }`}
              title="Toggle visibility"
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-tint text-primary border-l-[3px] border-primary font-semibold'
                    : 'text-text-secondary hover:bg-orange-tint/40 hover:text-text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Info Section */}
      <div className="border-t border-border p-4 space-y-4">
        {/* User Card */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold border border-border shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-text-primary block truncate">{userName}</span>
            <span className="text-[10px] text-text-secondary block truncate">{userCollege}</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-semibold text-text-secondary hover:text-destructive hover:bg-destructive/5 rounded-lg transition duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
