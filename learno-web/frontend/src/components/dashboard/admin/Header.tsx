'use client';

import Image from 'next/image';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { NotificationBell } from '@/components/dashboard/shared/NotificationBell';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSidebar?: () => void;
}

export function Header({ title, subtitle, onOpenSidebar }: HeaderProps) {
  const { adminStats } = useRealtimeDashboard();

  return (
    <header
      className="bg-white px-7 py-4 flex items-center justify-between sticky top-0 z-10"
      style={{ borderBottom: '1px solid #ECEEF4' }}
    >
      <div>
        <h1 className="text-slate-800" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="text-slate-400 mt-0.5" style={{ fontSize: '13px', fontWeight: 400 }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
        >
          <span className="sr-only">Open sidebar</span>
          <span className="w-4 h-4 rounded-sm border border-slate-400" />
        </button>
        <div className="hidden lg:flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: '#FFF1F2',
              color: '#E11D48',
              border: '1px solid #FECDD3',
            }}
          >
            Open Alerts {formatBadgeCount(adminStats.alertsCount)}
          </span>
          <span
            className="rounded-full px-2.5 py-1"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
            }}
          >
            Flagged {formatBadgeCount(adminStats.flaggedStudents)}
          </span>
        </div>

        <NotificationBell
          buttonClassName="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
        />

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image
              src="/admin/sarah-admin.svg"
              alt="Sarah Admin"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-slate-700" style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>
              Sarah Admin
            </p>
            <p className="text-slate-400" style={{ fontSize: '11px' }}>
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

