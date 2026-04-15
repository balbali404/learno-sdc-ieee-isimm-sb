'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface AdminShellProps {
  children: React.ReactNode;
}

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/admin': {
    title: 'Dashboard',
    subtitle: 'School Administration - Learno Platform',
  },
  '/admin/students': { title: 'Students', subtitle: '248 enrolled students' },
  '/admin/classes': { title: 'Classes', subtitle: 'Manage classes, subjects and assignments' },
  '/admin/teachers': { title: 'Teachers', subtitle: '67 active teachers' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Detailed reports and insights' },
  '/admin/alerts': { title: 'Alerts', subtitle: '5 unresolved alerts today' },
  '/admin/reports': { title: 'Reports', subtitle: 'Generated and scheduled reports' },
  '/admin/sessions': { title: 'Sessions', subtitle: 'Manage live sessions and history' },
  '/admin/settings': { title: 'Settings', subtitle: 'Platform configuration' },
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { adminStats } = useRealtimeDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = pageMeta[pathname] ?? pageMeta['/admin'];

  const subtitleByPath: Record<string, string> = {
    '/admin/students': `${adminStats.studentCount} enrolled students`,
    '/admin/classes': `${adminStats.activeClasses} active classes`,
    '/admin/teachers': `${adminStats.teacherCount} active teachers`,
    '/admin/alerts': `${formatBadgeCount(adminStats.alertsCount)} unresolved alerts today`,
    '/admin/sessions': `${formatBadgeCount(adminStats.liveSessions)} live sessions in progress`,
  };

  const subtitle = subtitleByPath[pathname] ?? meta.subtitle;

  const quickLinks = [
    {
      href: '/admin/students',
      label: 'Students',
      badge: formatBadgeCount(adminStats.studentCount, 999),
    },
    {
      href: '/admin/classes',
      label: 'Classes',
      badge:
        adminStats.activeClasses > 0
          ? formatBadgeCount(adminStats.activeClasses, 999)
          : undefined,
    },
    {
      href: '/admin/teachers',
      label: 'Teachers',
      badge:
        adminStats.teacherCount > 0
          ? formatBadgeCount(adminStats.teacherCount, 999)
          : undefined,
    },
    {
      href: '/admin/alerts',
      label: 'Alerts',
      badge:
        adminStats.alertsCount > 0
          ? formatBadgeCount(adminStats.alertsCount)
          : undefined,
    },
    {
      href: '/admin/students',
      label: 'Flagged Students',
      badge:
        adminStats.flaggedStudents > 0
          ? formatBadgeCount(adminStats.flaggedStudents)
          : undefined,
    },
    {
      href: '/admin/sessions',
      label: 'Live Sessions',
      badge:
        adminStats.liveSessions > 0
          ? formatBadgeCount(adminStats.liveSessions)
          : undefined,
    },
  ];

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: '#F7F8FB',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={meta.title} subtitle={subtitle} onOpenSidebar={() => setSidebarOpen(true)} />

        <div className="border-b border-[#ECEEF4] bg-white px-7 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {quickLinks.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 whitespace-nowrap transition-colors ${
                    active
                      ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
                      : 'border-[#ECEEF4] bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {item.label}
                  {item.badge ? (
                    <span
                      className="inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-white"
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#2563EB',
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-7 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

