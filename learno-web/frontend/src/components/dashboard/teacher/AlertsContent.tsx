'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ApiError, teacherApi } from '@/lib/api';
import type { NotificationItem } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

const severityMap = (notification: NotificationItem): 'urgent' | 'warning' | 'info' => {
  const title = `${notification.title} ${notification.message}`.toLowerCase();

  if (title.includes('failed') || title.includes('critical') || title.includes('error')) {
    return 'urgent';
  }

  if (title.includes('alert') || title.includes('warning') || notification.type === 'AI_ALERT') {
    return 'warning';
  }

  return 'info';
};

const severityClass: Record<'urgent' | 'warning' | 'info', string> = {
  urgent: 'bg-red-50 text-red-700 border-red-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  info: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatTime = (isoDate: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return 'Unknown time';
  }
};

export function AlertsContent() {
  const { token } = useStoredAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teacherApi.getNotifications();
      setNotifications(response ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load alerts.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    loadNotifications().catch(() => null);
  }, [token]);

  const unresolved = notifications.filter((item) => !item.read);
  const urgentCount = unresolved.filter((item) => severityMap(item) === 'urgent').length;
  const warningCount = unresolved.filter((item) => severityMap(item) === 'warning').length;
  const infoCount = unresolved.filter((item) => severityMap(item) === 'info').length;

  const visibleAlerts = notifications.filter((notification) =>
    showResolved ? true : !notification.read,
  );

  const markAsRead = async (notificationId: string) => {
    setIsMarking(true);
    setError(null);

    try {
      await teacherApi.readNotification(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update alert status.');
      }
    } finally {
      setIsMarking(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Alerts</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load alert notifications.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">Pulled from `/teacher/notifications`.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowResolved((value) => !value)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            showResolved
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {showResolved ? 'Showing Resolved' : 'Show Resolved'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
          <p className="text-sm text-red-700 mt-1">Urgent</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{warningCount}</p>
          <p className="text-sm text-amber-700 mt-1">Warnings</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-3xl font-bold text-slate-700">{infoCount}</p>
          <p className="text-sm text-slate-600 mt-1">Info</p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading alerts...
          </div>
        ) : null}

        {!isLoading && visibleAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No alerts to show.
          </div>
        ) : null}

        {!isLoading
          ? visibleAlerts.map((notification) => {
              const severity = severityMap(notification);
              return (
                <article
                  key={notification.id}
                  className={`rounded-xl border px-4 py-3.5 bg-white ${
                    notification.read ? 'opacity-60 border-slate-100' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityClass[severity]}`}
                        >
                          {severity.toUpperCase()}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                          {notification.type}
                        </span>
                        {notification.read ? (
                          <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                            Resolved
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-700">
                        {notification.title || 'Alert'}
                      </h3>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="text-xs text-slate-400">{formatTime(notification.createdAt)}</p>
                    </div>

                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        disabled={isMarking}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={12} />
                        Mark Read
                      </button>
                    ) : (
                      <AlertCircle size={16} className="text-slate-300 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}
