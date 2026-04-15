'use client';

import { Search, Menu } from 'lucide-react';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { NotificationBell } from '@/components/dashboard/shared/NotificationBell';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useStoredAuth();
  const { teacherStats } = useRealtimeDashboard();

  const initials = (() => {
    const fullName = user?.fullName ?? 'Teacher';
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TE';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  })();

  return (
    <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, sessions…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30 focus:border-[#54C3EF] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden lg:flex items-center gap-2 mr-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            Alerts {formatBadgeCount(teacherStats.alertsCount)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
            Students {formatBadgeCount(teacherStats.studentCount, 999)}
          </span>
        </div>

        <NotificationBell />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#54C3EF] flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-none">{user?.fullName ?? 'Teacher'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.role ?? 'TEACHER'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
