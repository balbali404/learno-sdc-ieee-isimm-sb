'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2, Save, User } from 'lucide-react';
import { ApiError, teacherApi } from '@/lib/api';
import type { TeacherProfile, TeacherSettings } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-[#54C3EF]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

const defaultSettings: TeacherSettings = {
  id: '',
  userId: '',
  urgentAlerts: true,
  environmentWarnings: true,
  sessionSummaries: true,
  weeklyReports: false,
  soundAlerts: false,
};

const defaultProfile: TeacherProfile = {
  id: '',
  fullName: '',
  email: '',
  role: 'TEACHER',
  profile: {
    avatarUrl: null,
    phone: null,
    bio: null,
  },
};

export function SettingsContent() {
  const { token } = useStoredAuth();
  const [profile, setProfile] = useState<TeacherProfile>(defaultProfile);
  const [settings, setSettings] = useState<TeacherSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [profileResult, settingsResult] = await Promise.allSettled([
        teacherApi.getProfile(),
        teacherApi.getSettings(),
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile({
          ...defaultProfile,
          ...profileResult.value,
          profile: {
            avatarUrl: profileResult.value.profile?.avatarUrl ?? null,
            phone: profileResult.value.profile?.phone ?? null,
            bio: profileResult.value.profile?.bio ?? null,
          },
        });
      }

      if (settingsResult.status === 'fulfilled') {
        setSettings({
          ...defaultSettings,
          ...settingsResult.value,
        });
      }

      if (profileResult.status === 'rejected' && settingsResult.status === 'rejected') {
        const reason = profileResult.reason;
        if (reason instanceof ApiError) {
          setError(reason.message);
        } else {
          setError('Failed to load teacher settings.');
        }
      }

      setIsLoading(false);
    };

    loadData().catch(() => null);
  }, [token]);

  const saveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await Promise.all([
        teacherApi.updateProfile({
          fullName: profile.fullName,
          avatarUrl: profile.profile?.avatarUrl ?? null,
          phone: profile.profile?.phone ?? null,
          bio: profile.profile?.bio ?? null,
        }),
        teacherApi.updateSettings({
          urgentAlerts: settings.urgentAlerts,
          environmentWarnings: settings.environmentWarnings,
          sessionSummaries: settings.sessionSummaries,
          weeklyReports: settings.weeklyReports,
          soundAlerts: settings.soundAlerts,
        }),
      ]);

      setSuccessMessage('Settings updated successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save settings.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load your settings.</p>
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
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Linked to `/teacher/profile` and `/teacher/settings`.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <User size={16} className="text-slate-500" />
          </div>
          <h2 className="font-semibold text-slate-800">Profile</h2>
        </header>

        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={profile.fullName}
              onChange={(event) =>
                setProfile((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={profile.email ?? ''}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <input
              value={profile.role}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Avatar URL</label>
            <input
              value={profile.profile?.avatarUrl ?? ''}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  profile: {
                    avatarUrl: event.target.value,
                    phone: prev.profile?.phone ?? null,
                    bio: prev.profile?.bio ?? null,
                  },
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              value={profile.profile?.phone ?? ''}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  profile: {
                    avatarUrl: prev.profile?.avatarUrl ?? null,
                    phone: event.target.value,
                    bio: prev.profile?.bio ?? null,
                  },
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
            <textarea
              rows={3}
              value={profile.profile?.bio ?? ''}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  profile: {
                    avatarUrl: prev.profile?.avatarUrl ?? null,
                    phone: prev.profile?.phone ?? null,
                    bio: event.target.value,
                  },
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30 resize-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Bell size={16} className="text-slate-500" />
          </div>
          <h2 className="font-semibold text-slate-800">Notifications</h2>
        </header>

        <div className="px-5 py-4 space-y-3">
          {[
            {
              key: 'urgentAlerts' as const,
              title: 'Urgent Alerts',
              subtitle: 'Critical classroom and system alerts',
            },
            {
              key: 'environmentWarnings' as const,
              title: 'Environment Warnings',
              subtitle: 'Noise, air and environmental notifications',
            },
            {
              key: 'sessionSummaries' as const,
              title: 'Session Summaries',
              subtitle: 'AI lesson summary draft updates',
            },
            {
              key: 'weeklyReports' as const,
              title: 'Weekly Reports',
              subtitle: 'Weekly digest email notifications',
            },
            {
              key: 'soundAlerts' as const,
              title: 'Sound Alerts',
              subtitle: 'Play sound for realtime warnings',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
              </div>
              <Toggle
                checked={settings[item.key]}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, [item.key]: value }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={saveChanges}
        disabled={isLoading || isSaving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#54C3EF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b6e8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading || isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save Settings
      </button>
    </div>
  );
}
