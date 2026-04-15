'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface GuardianNavItem {
  path: string;
  icon: typeof Home;
  label: string;
  exact?: boolean;
  badge?: string;
}

const baseNavItems: GuardianNavItem[] = [
  { path: '/guardian', icon: Home, label: 'Dashboard', exact: true },
  { path: '/guardian/children', icon: Users, label: 'My Children' },
  { path: '/guardian/progress', icon: TrendingUp, label: 'Progress' },
  { path: '/guardian/recommended-tools', icon: BookOpen, label: 'Recommended Tools' },
  { path: '/guardian/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/guardian/notifications', icon: Bell, label: 'Notifications' },
  { path: '/guardian/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function isActiveRoute(pathname: string, path: string, exact?: boolean) {
  if (exact) {
    return pathname === path;
  }

  return pathname.startsWith(path);
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { guardianStats } = useRealtimeDashboard();
  const { user } = useStoredAuth();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors and clear local auth anyway
    }

    setSidebarOpen(false);
    router.push('/login');
  };

  const userInitials = (() => {
    const fullName = user?.fullName ?? 'Guardian';
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'GU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  })();

  const navItems = useMemo<GuardianNavItem[]>(
    () =>
      baseNavItems.map((item) => {
        if (item.path === '/guardian') {
          return {
            ...item,
            badge:
              guardianStats.alertsCount > 0
                ? formatBadgeCount(guardianStats.alertsCount)
                : undefined,
          };
        }

        if (item.path === '/guardian/children') {
          return {
            ...item,
            badge:
              guardianStats.childCount > 0
                ? formatBadgeCount(guardianStats.childCount, 999)
                : undefined,
          };
        }

        if (item.path === '/guardian/messages') {
          return {
            ...item,
            badge:
              guardianStats.unreadMessages > 0
                ? formatBadgeCount(guardianStats.unreadMessages)
                : undefined,
          };
        }

        if (item.path === '/guardian/notifications') {
          return {
            ...item,
            badge:
              guardianStats.unreadNotifications > 0
                ? formatBadgeCount(guardianStats.unreadNotifications)
                : undefined,
          };
        }

        return item;
      }),
    [
      guardianStats.alertsCount,
      guardianStats.childCount,
      guardianStats.unreadMessages,
      guardianStats.unreadNotifications,
    ],
  );

  return (
    <>
      {sidebarOpen ? (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-64 h-full bg-white border-r border-gray-200 p-6 flex flex-col transition-transform duration-300`}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#EBF4FF] border border-[#BFDBFE] flex items-center justify-center">
                <Image
                  src="/guardian/brand-mark.svg"
                  alt="Learno"
                  width={20}
                  height={20}
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#2C3E50] leading-none">
                  Learno
                </h1>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, exact, badge }) => {
            const active = isActiveRoute(pathname, path, exact);

            return (
              <Link
                key={path}
                href={path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  active
                    ? 'bg-[#EBF4FF] text-[#2563EB]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            <div className="h-9 w-9 rounded-full bg-[#54C3EF] text-white text-sm font-semibold flex items-center justify-center">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName ?? 'Guardian'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email ?? 'guardian@learno.local'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
