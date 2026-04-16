'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Users, BarChart2, Bell,
  FileText, Settings, LogOut, ChevronRight, X, History, MessageSquare, Brain
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string | number;
}

const baseNavItems: NavItem[] = [
  { path: '/teacher',           label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { path: '/teacher/classes',   label: 'My Classes',       icon: BookOpen },
  { path: '/teacher/students',  label: 'Students',         icon: Users },
  { path: '/teacher/neuro-tests', label: 'Neuro Tests',    icon: Brain },
  { path: '/teacher/messages',  label: 'Messages',         icon: MessageSquare },
  { path: '/teacher/analytics', label: 'Session Analytics',icon: BarChart2 },
  { path: '/teacher/history',   label: 'Lesson History',   icon: History },
  { path: '/teacher/alerts',    label: 'Alerts',           icon: Bell },
  { path: '/teacher/reports',   label: 'Reports',          icon: FileText },
  { path: '/teacher/settings',  label: 'Settings',         icon: Settings },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useStoredAuth();
  const { teacherStats } = useRealtimeDashboard();

  const navItems = useMemo<NavItem[]>(() => {
    const badgeByPath: Record<string, string | number | undefined> = {
      '/teacher/students': formatBadgeCount(teacherStats.studentCount),
      '/teacher/messages':
        teacherStats.unreadMessages > 0
          ? formatBadgeCount(teacherStats.unreadMessages)
          : undefined,
      '/teacher/alerts':
        teacherStats.alertsCount > 0
          ? formatBadgeCount(teacherStats.alertsCount)
          : undefined,
      '/teacher/reports':
        teacherStats.pendingApprovals > 0
          ? formatBadgeCount(teacherStats.pendingApprovals)
          : undefined,
    };

    return baseNavItems.map((item) => ({
      ...item,
      badge: badgeByPath[item.path],
    }));
  }, [teacherStats.alertsCount, teacherStats.pendingApprovals, teacherStats.studentCount, teacherStats.unreadMessages]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors and clear local auth anyway
    }

    router.push('/login');
  };

  const userInitials = (() => {
    const fullName = user?.fullName ?? 'Teacher';
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TE';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  })();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-64 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9">
                <Image
                  src="/logo/logo.png"
                  alt="Learno Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-base leading-none">Learno</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
            Main Menu
          </p>
          {navItems.map(item => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  active
                    ? 'bg-[#54C3EF]/12 text-[#0ea5e9] font-medium border border-[#54C3EF]/25'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon
                  size={18}
                  className={active ? 'text-[#54C3EF]' : 'text-slate-400 group-hover:text-slate-600'}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-orange-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight size={14} className="text-[#54C3EF]" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#54C3EF] to-[#2BB5E8] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-medium truncate">{user?.fullName ?? 'Teacher'}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email ?? 'No email'}</p>
            </div>
            <LogOut size={15} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
}
