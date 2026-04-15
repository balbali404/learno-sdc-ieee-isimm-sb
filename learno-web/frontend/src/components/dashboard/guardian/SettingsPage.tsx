'use client';

import { Bell, CheckCircle2, ChevronRight, Globe, HelpCircle, Loader2, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { ApiError, authApi } from '@/lib/api';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface ToggleItem {
  key: string;
  title: string;
  description: string;
}

const notificationToggles: ToggleItem[] = [
  {
    key: 'emailNotifications',
    title: 'Email Notifications',
    description: 'Receive key updates by email.',
  },
  {
    key: 'pushNotifications',
    title: 'Push Notifications',
    description: 'Get instant alerts on your phone.',
  },
  {
    key: 'weeklyReports',
    title: 'Weekly Reports',
    description: 'A simple weekly family learning summary.',
  },
  {
    key: 'teacherMessages',
    title: 'Teacher Messages',
    description: 'Immediate alerts when a teacher sends a message.',
  },
  {
    key: 'quietHours',
    title: 'Quiet Hours',
    description: 'Mute non-urgent notifications during family time.',
  },
  {
    key: 'muteAllNonCritical',
    title: 'Mute Non-Critical Alerts',
    description: 'Only critical notifications will still appear.',
  },
];

type NotificationState = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  teacherMessages: boolean;
  quietHours: boolean;
  muteAllNonCritical: boolean;
};

const initialNotificationState: NotificationState = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: true,
  teacherMessages: true,
  quietHours: false,
  muteAllNonCritical: false,
};

export function SettingsPage() {
  const [notifications, setNotifications] = useState<NotificationState>(
    initialNotificationState,
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { guardianStats } = useRealtimeDashboard();

  const toggleNotification = (key: keyof NotificationState) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const onChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Unable to change password right now.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-[#2C3E50]">Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage your account preferences and family notifications.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">
            Children {formatBadgeCount(guardianStats.childCount, 999)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1.5 text-xs font-semibold text-[#15803D]">
            Unread Messages {formatBadgeCount(guardianStats.unreadMessages)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#334155]">
            Notifications {formatBadgeCount(guardianStats.unreadNotifications)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
                <User className="text-[#2563EB]" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-[#2C3E50]">
                Account Information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Ahmed Al-Mansour"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="ahmed.almansour@email.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+971 50 123 4567"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              </div>

              <div className="pt-2">
                <button className="px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8]">
                  Save Changes
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
                <Bell className="text-[#2563EB]" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-[#2C3E50]">
                Notification Preferences
              </h3>
            </div>

            <div className="space-y-4">
              {notificationToggles.map((item) => {
                const value = notifications[item.key as keyof NotificationState];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification(item.key as keyof NotificationState)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        value ? 'bg-[#2563EB]' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          value ? 'transform translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              {notifications.quietHours ? (
                <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E3A8A]">
                  Quiet hours are enabled from 9:00 PM to 7:00 AM. Critical alerts will still arrive.
                </div>
              ) : null}

              {notifications.muteAllNonCritical ? (
                <div className="rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
                  Non-critical notifications are muted. You may miss routine updates.
                </div>
              ) : null}
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
                <Shield className="text-[#2563EB]" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-[#2C3E50]">
                Privacy &amp; Security
              </h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-600 mt-1">
                  Use a unique password to protect your guardian account.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Current password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void onChangePassword()}
                    disabled={isChangingPassword}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isChangingPassword ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Shield size={16} />
                    )}
                    Update Password
                  </button>
                  {passwordSuccess ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <CheckCircle2 size={16} />
                      {passwordSuccess}
                    </span>
                  ) : null}
                </div>

                {passwordError ? (
                  <p className="mt-3 text-sm text-red-700">{passwordError}</p>
                ) : null}
              </div>

              <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium text-gray-900">Privacy Dashboard</span>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FEF9C3] rounded-lg flex items-center justify-center">
                <HelpCircle className="text-[#CA8A04]" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-[#2C3E50]">Support</h3>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Help Center</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Contact Support</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Terms of Service</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
