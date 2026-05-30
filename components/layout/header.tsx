'use client';

import Link from 'next/link';
import NotificationBell from './notification-bell';

export default function Header() {
  return (
    <header className="h-14 bg-surface border-b border-border fixed top-0 left-0 right-0 flex items-center justify-between px-4 lg:hidden z-40 transition-colors duration-200 shadow-sm">
      <Link href="/dashboard" className="text-xl font-extrabold text-primary tracking-tight">
        PeerPrep
      </Link>
      
      <div className="flex items-center space-x-2">
        <NotificationBell />
      </div>
    </header>
  );
}
