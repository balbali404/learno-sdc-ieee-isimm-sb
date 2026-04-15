'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { NotificationBell } from '@/components/dashboard/shared/NotificationBell';
import { formatBadgeCount } from '@/lib/dashboard/format';
import { useStoredAuth } from '@/hooks/useStoredAuth';

interface GuardianShellProps {
  children: React.ReactNode;
}

export function GuardianShell({ children }: GuardianShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { guardianStats } = useRealtimeDashboard();
  const { user } = useStoredAuth();

  const initials = (() => {
    const fullName = user?.fullName ?? 'Guardian';
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'GU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  })();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:flex items-center gap-2 mr-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
              Alerts {formatBadgeCount(guardianStats.alertsCount)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
              Children {formatBadgeCount(guardianStats.childCount, 999)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#54C3EF] flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-800 leading-none">{user?.fullName ?? 'Guardian'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.role ?? 'GUARDIAN'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-5 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href="/guardian/children"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Children
              <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold text-white">
                {formatBadgeCount(guardianStats.childCount, 999)}
              </span>
            </Link>

            <Link
              href="/guardian/messages"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Messages
              <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                {formatBadgeCount(guardianStats.unreadMessages)}
              </span>
            </Link>

            <Link
              href="/guardian/notifications"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Notifications
              <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[11px] font-bold text-white">
                {formatBadgeCount(guardianStats.unreadNotifications)}
              </span>
            </Link>

            <span className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
              Pending {formatBadgeCount(guardianStats.pendingEnrollments, 999)}
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
