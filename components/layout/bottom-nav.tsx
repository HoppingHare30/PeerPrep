'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, User } from 'lucide-react';

interface BottomNavProps {
  userId: string;
}

export default function BottomNav({ userId }: BottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/sessions', label: 'Sessions', icon: Calendar },
    { href: `/profile/${userId}`, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border h-16 flex items-center justify-around lg:hidden z-40 transition-colors duration-200 shadow-lg px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 ${
              isActive 
                ? 'text-primary font-semibold scale-105' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
