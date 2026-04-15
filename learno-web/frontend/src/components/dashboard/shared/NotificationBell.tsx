'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api';
import type { NotificationItem } from '@/lib/api/types';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface NotificationBellProps {
  buttonClassName?: string;
}

export function NotificationBell({ buttonClassName }: NotificationBellProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const feed = await authApi.getMyNotifications({ limit: 8 });
      setNotifications(feed.notifications);
      setUnreadCount(feed.unreadCount);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to load notifications.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const hasUnread = unreadCount > 0;

  const unreadIds = useMemo(
    () => notifications.filter((item) => !item.read).map((item) => item.id),
    [notifications],
  );

  const markVisibleAsRead = async () => {
    if (unreadIds.length === 0) {
      return;
    }

    await Promise.all(unreadIds.map((notificationId) => authApi.markMyNotificationRead(notificationId)));
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName ?? 'relative p-2 rounded-xl hover:bg-slate-100 transition-colors'}
      >
        <Bell size={19} className="text-slate-600" />
        {hasUnread ? (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 rounded-full bg-orange-400 px-1 text-[10px] font-bold leading-4 text-white text-center border border-white">
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <button
              type="button"
              onClick={() => void markVisibleAsRead()}
              disabled={unreadIds.length === 0}
              className="text-xs font-semibold text-sky-600 disabled:text-slate-400"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto px-2 py-2">
            {isLoading ? <p className="px-2 py-2 text-sm text-slate-500">Loading...</p> : null}

            {!isLoading && error ? <p className="px-2 py-2 text-sm text-red-600">{error}</p> : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">No notifications yet.</p>
            ) : null}

            {!isLoading && !error
              ? notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.read) {
                        return;
                      }

                      void authApi.markMyNotificationRead(item.id);
                      setNotifications((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, read: true } : entry,
                        ),
                      );
                      setUnreadCount((count) => Math.max(0, count - 1));
                    }}
                    className={`mb-1 w-full rounded-lg border px-2 py-2 text-left transition-colors ${
                      item.read
                        ? 'border-slate-100 bg-white text-slate-600'
                        : 'border-sky-100 bg-sky-50/60 text-slate-700 hover:bg-sky-50'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.type}</p>
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.message}</p>
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
