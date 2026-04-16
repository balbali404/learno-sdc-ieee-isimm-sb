'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  Bell,
  FileText,
  BookOpen,
  Settings,
  Activity,
  LogOut,
  X,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface AdminNavItem {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
  exact?: boolean;
  badge?: string;
}

const baseNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin', exact: true },
  { icon: Users, label: 'Students', to: '/admin/students' },
  { icon: BookOpen, label: 'Classes', to: '/admin/classes' },
  { icon: GraduationCap, label: 'Teachers', to: '/admin/teachers' },
  { icon: BarChart3, label: 'Analytics', to: '/admin/analytics' },
  { icon: Bell, label: 'Alerts', to: '/admin/alerts' },
  { icon: FileText, label: 'Reports', to: '/admin/reports' },
  { icon: Activity, label: 'Sessions', to: '/admin/sessions' },
];

function isRouteActive(pathname: string, to: string, exact?: boolean) {
  if (exact) {
    return pathname === to;
  }

  return pathname.startsWith(to);
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useStoredAuth();
  const { adminStats } = useRealtimeDashboard();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors and clear local auth anyway
    }

    router.push('/login');
  };

  const userInitials = (() => {
    const fullName = user?.fullName ?? 'Admin';
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AD';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  })();

  const navItems = useMemo<AdminNavItem[]>(
    () =>
      baseNavItems.map((item) => {
        if (item.to === '/admin/students') {
          return {
            ...item,
            badge: formatBadgeCount(adminStats.studentCount, 999),
          };
        }

        if (item.to === '/admin/teachers') {
          return {
            ...item,
            badge:
              adminStats.teacherCount > 0
                ? formatBadgeCount(adminStats.teacherCount, 999)
                : undefined,
          };
        }

        if (item.to === '/admin/classes') {
          return {
            ...item,
            badge:
              adminStats.activeClasses > 0
                ? formatBadgeCount(adminStats.activeClasses, 999)
                : undefined,
          };
        }

        if (item.to === '/admin/alerts') {
          return {
            ...item,
            badge:
              adminStats.alertsCount > 0
                ? formatBadgeCount(adminStats.alertsCount)
                : undefined,
          };
        }

        if (item.to === '/admin/sessions') {
          return {
            ...item,
            badge:
              adminStats.liveSessions > 0
                ? formatBadgeCount(adminStats.liveSessions)
                : undefined,
          };
        }

        return item;
      }),
    [
      adminStats.alertsCount,
      adminStats.activeClasses,
      adminStats.liveSessions,
      adminStats.studentCount,
      adminStats.teacherCount,
    ],
  );

  return (
    <>
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed lg:sticky top-0 z-30 w-60 h-screen bg-white flex flex-col flex-shrink-0 overflow-hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ borderRight: '1px solid #ECEEF4' }}
      >
<div
        className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #ECEEF4' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/logo/logo.png"
              alt="Learno Logo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <span
              className="text-slate-800"
              style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.3px' }}
            >
              Learno
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-400 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="text-slate-400 uppercase px-3 mb-3"
          style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.09em' }}
        >
          Main Menu
        </p>
        {navItems.map(({ icon: Icon, label, to, badge, exact }) => {
          const active = isRouteActive(pathname, to, exact);

          return (
              <Link
                key={label}
                href={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 no-underline ${
                  active ? 'text-slate-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
                style={{ background: active ? '#DBEAFE' : 'transparent' }}
              >
                <Icon
                  className="flex-shrink-0 transition-colors"
                  style={{
                    width: '18px',
                    height: '18px',
                    color: active ? '#1D4ED8' : undefined,
                  }}
                />
              <span className="flex-1 text-left" style={{ fontSize: '13.5px', fontWeight: active ? 600 : 500 }}>
                {label}
              </span>
                {badge ? (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      background: active ? '#BFDBFE' : '#F1F5F9',
                      color: active ? '#1E3A8A' : '#64748B',
                    }}
                  >
                    {badge}
                  </span>
                ) : null}
                {active ? (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#93C5FD' }} />
                ) : null}
              </Link>
            );
          })}
      </nav>

      <div
        className="px-3 pb-4 pt-3 space-y-1.5 shrink-0 bg-white"
        style={{ borderTop: '1px solid #ECEEF4' }}
      >
        <Link
          href="/admin/settings"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 no-underline ${
            pathname === '/admin/settings'
              ? 'text-slate-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          style={{ background: pathname === '/admin/settings' ? '#DBEAFE' : 'transparent' }}
        >
          <Settings
            className="flex-shrink-0 transition-colors"
            style={{
              width: '18px',
              height: '18px',
              color: pathname === '/admin/settings' ? '#1D4ED8' : undefined,
            }}
          />
          <span style={{ fontSize: '13.5px', fontWeight: pathname === '/admin/settings' ? 600 : 500 }}>
            Settings
          </span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Logout</span>
        </button>

        <div className="mt-1 mx-1 p-3 rounded-xl bg-slate-50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-slate-700 truncate" style={{ fontSize: '13px', fontWeight: 600 }}>
              {user?.fullName ?? 'Administrator'}
            </p>
            <p className="text-slate-400 truncate" style={{ fontSize: '11px' }}>
              {user?.email ?? 'admin@learno.local'}
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}

