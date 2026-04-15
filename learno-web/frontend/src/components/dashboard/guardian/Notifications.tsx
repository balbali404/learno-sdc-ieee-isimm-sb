'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { ApiError, authApi } from '@/lib/api';
import type { NotificationItem } from '@/lib/api/types';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

const formatNotificationTime = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Unknown time';
  }
};

export function Notifications() {
  const { guardianStats } = useRealtimeDashboard();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const feed = await authApi.getMyNotifications({ limit: 30 });
        setNotifications(feed.notifications ?? []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Unable to load notifications.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications().catch(() => null);
  }, []);

  const unreadItems = useMemo(
    () => notifications.filter((item) => !item.read),
    [notifications],
  );

  const markOneAsRead = async (notificationId: string) => {
    try {
      await authApi.markMyNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );
    } catch {
      // ignore individual mark-as-read errors for smooth UX
    }
  };

  const markAllAsRead = async () => {
    if (unreadItems.length === 0) {
      return;
    }

    setIsMarkingAllRead(true);
    setError(null);

    try {
      await Promise.all(
        unreadItems.map((item) => authApi.markMyNotificationRead(item.id)),
      );
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to mark all notifications as read.');
      }
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C3E50]">Notifications</h2>
          <p className="text-gray-600 mt-1">
            Keep up with teacher, class, and platform updates.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#334155]">
              Unread {formatBadgeCount(unreadItems.length)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1.5 text-xs font-semibold text-[#15803D]">
              Messages {formatBadgeCount(guardianStats.unreadMessages)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-1.5 text-xs font-semibold text-[#BE123C]">
              Alerts {formatBadgeCount(guardianStats.alertsCount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void markAllAsRead()}
          disabled={isMarkingAllRead || unreadItems.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#EBF4FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMarkingAllRead ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Mark all read
        </button>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 inline-flex items-center gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" />
            Loading notifications...
          </div>
        ) : null}

        {!isLoading && notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            <Bell size={22} className="mx-auto text-gray-300" />
            <p className="mt-2">No notifications yet.</p>
          </div>
        ) : null}

        {!isLoading ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((item) => {
              const isUnread = !item.read;
              const urgent = /alert|risk|urgent|warning/i.test(
                `${item.type} ${item.title} ${item.message}`,
              );

              return (
                <article
                  key={item.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isUnread ? 'bg-[#F8FAFF]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center ${
                        urgent
                          ? 'bg-[#FEF2F2] text-[#B91C1C]'
                          : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}
                    >
                      {urgent ? <ShieldAlert size={16} /> : <Bell size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        {isUnread ? (
                          <span className="inline-flex rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
                            New
                          </span>
                        ) : null}
                        <span className="text-xs text-gray-400">{formatNotificationTime(item.createdAt)}</span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                        {item.type}
                      </p>
                    </div>

                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => void markOneAsRead(item.id)}
                        className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
