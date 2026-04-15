'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface TeacherShellProps {
  children: React.ReactNode;
}

export function TeacherShell({ children }: TeacherShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { teacherStats } = useRealtimeDashboard();

  const quickLinks = [
    { href: '/teacher/classes', label: 'My Classes' },
    {
      href: '/teacher/students',
      label: 'Students',
      badge: formatBadgeCount(teacherStats.studentCount, 999),
    },
    {
      href: '/teacher/neuro-tests',
      label: 'Neuro Tests',
    },
    {
      href: '/teacher/messages',
      label: 'Messages',
      badge:
        teacherStats.unreadMessages > 0
          ? formatBadgeCount(teacherStats.unreadMessages)
          : undefined,
    },
    {
      href: '/teacher/alerts',
      label: 'Alerts',
      badge:
        teacherStats.alertsCount > 0
          ? formatBadgeCount(teacherStats.alertsCount)
          : undefined,
    },
    {
      href: '/teacher/reports',
      label: 'Reports',
      badge:
        teacherStats.pendingApprovals > 0
          ? formatBadgeCount(teacherStats.pendingApprovals)
          : undefined,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="border-b border-slate-200 bg-white px-5 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {quickLinks.map((item) => {
              const isActive =
                item.href === '/teacher'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-sky-200 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {item.badge ? (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
