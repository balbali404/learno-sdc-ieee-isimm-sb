"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Globe,
  Loader2,
  Palette,
  Save,
  Shield,
  User,
} from "lucide-react";
import { ApiError, authApi, studentApi } from "@/lib/api";
import type {
  StudentNotificationSettings,
  StudentProfile,
  UpdateStudentProfileInput,
} from "@/lib/api/student";
import { setStoredUser, type StoredUser } from "@/lib/auth/storage";
import { useStoredAuth } from "@/hooks/useStoredAuth";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{
        background: checked
          ? "linear-gradient(90deg, var(--color-accent), var(--color-highlight))"
          : "rgba(var(--student-accent-rgb, 111 168 220), 0.28)",
      }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

interface ToggleRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ icon: Icon, label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#EAF4FB] bg-[#F7FBFF] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#EAF4FB] p-2">
          <Icon size={14} className="text-[#6FA8DC]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#2F3A4A]">{label}</p>
          <p className="mt-0.5 text-xs text-[#8FB8E0]">{description}</p>
        </div>
      </div>

      <Toggle checked={value} onChange={onChange} />
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#D6EAF8] bg-white">
      <header className="flex items-center gap-3 border-b border-[#EAF4FB] px-5 py-4">
        <div className="rounded-lg border border-[#D6EAF8] bg-[#EAF4FB] p-2">
          <Icon size={15} className="text-[#6FA8DC]" />
        </div>
        <h2 className="text-sm font-semibold text-[#2F3A4A]">{title}</h2>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

const defaultSettings: StudentNotificationSettings = {
  id: "",
  userId: "",
  urgentAlerts: true,
  environmentWarnings: true,
  sessionSummaries: true,
  weeklyReports: false,
  soundAlerts: false,
};

const defaultProfile: StudentProfile = {
  id: "",
  fullName: "",
  email: "",
  role: "STUDENT",
  dateOfBirth: null,
  profile: {
    avatarUrl: null,
    phone: null,
    bio: null,
  },
};

export function SettingsPage() {
  const { token, user } = useStoredAuth();

  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [settings, setSettings] = useState<StudentNotificationSettings>(defaultSettings);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [language, setLanguage] = useState("English");
  const [studyReminders, setStudyReminders] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [profileResult, settingsResult] = await Promise.allSettled([
        studentApi.getProfile(),
        studentApi.getSettings(),
      ]);

      if (cancelled) {
        return;
      }

      if (profileResult.status === "fulfilled") {
        const value = profileResult.value;
        setProfile({
          ...defaultProfile,
          ...value,
          profile: {
            avatarUrl: value.profile?.avatarUrl ?? null,
            phone: value.profile?.phone ?? null,
            bio: value.profile?.bio ?? null,
          },
        });
      }

      if (settingsResult.status === "fulfilled") {
        setSettings({
          ...defaultSettings,
          ...settingsResult.value,
        });
      }

      if (profileResult.status === "rejected" && settingsResult.status === "rejected") {
        const reason = profileResult.reason;
        if (reason instanceof ApiError) {
          setError(reason.message);
        } else {
          setError("Failed to load settings.");
        }
      }

      setIsLoading(false);
    };

    const timer = window.setTimeout(() => {
      loadData().catch(() => null);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token]);

  const saveChanges = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const profileInput: UpdateStudentProfileInput = {
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth ?? null,
      avatarUrl: profile.profile?.avatarUrl ?? null,
      phone: profile.profile?.phone ?? null,
      bio: profile.profile?.bio ?? null,
    };

    try {
      const [profileResponse] = await Promise.all([
        studentApi.updateProfile(profileInput),
        studentApi.updateSettings({
          urgentAlerts: settings.urgentAlerts,
          environmentWarnings: settings.environmentWarnings,
          sessionSummaries: settings.sessionSummaries,
          weeklyReports: settings.weeklyReports,
          soundAlerts: settings.soundAlerts,
        }),
      ]);

      const updatedUser = profileResponse.user;
      const storedUser: StoredUser = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        schoolId: updatedUser.schoolId ?? null,
      };
      setStoredUser(storedUser);

      setSuccessMessage("Settings updated successfully.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not save settings.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to update password right now.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-[#D6EAF8] bg-white p-6">
        <h1 className="text-xl font-bold text-[#2F3A4A]">Settings</h1>
        <p className="mt-2 text-sm text-[#8FB8E0]">Sign in to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-[#2F3A4A]">Settings</h1>
        <p className="mt-1 text-sm text-[#8FB8E0]">
          Manage your profile, notification preferences, and account security.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-[#D6EAF8] bg-white px-4 py-3 text-sm text-[#6FA8DC]">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-[#D6EAF8] bg-[#EAF4FB] px-4 py-3 text-sm text-[#4A8CC0]">
          {successMessage}
        </div>
      ) : null}

      <Section title="Profile" icon={User}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Full Name</label>
            <input
              value={profile.fullName}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Email</label>
            <input
              value={profile.email ?? user?.email ?? ""}
              disabled
              className="w-full rounded-lg border border-[#D6EAF8] bg-[#F7FBFF] px-3 py-2 text-sm text-[#8FB8E0]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Date of Birth</label>
            <input
              type="date"
              value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ""}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  dateOfBirth: event.target.value || null,
                }))
              }
              className="w-full rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Phone</label>
            <input
              value={profile.profile?.phone ?? ""}
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
              className="w-full rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Avatar URL</label>
            <input
              value={profile.profile?.avatarUrl ?? ""}
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
              className="w-full rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Bio</label>
            <textarea
              rows={3}
              value={profile.profile?.bio ?? ""}
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
              className="w-full resize-none rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
            />
          </div>
        </div>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <div className="space-y-3">
          <ToggleRow
            icon={Bell}
            label="Urgent Alerts"
            description="Critical updates from your learning environment"
            value={settings.urgentAlerts}
            onChange={(value) => setSettings((prev) => ({ ...prev, urgentAlerts: value }))}
          />
          <ToggleRow
            icon={Bell}
            label="Environment Warnings"
            description="Attention and focus-impacting warning notifications"
            value={settings.environmentWarnings}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, environmentWarnings: value }))
            }
          />
          <ToggleRow
            icon={Bell}
            label="Session Summaries"
            description="Summary notifications after each learning session"
            value={settings.sessionSummaries}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, sessionSummaries: value }))
            }
          />
          <ToggleRow
            icon={Bell}
            label="Weekly Reports"
            description="Weekly digest of your study progress"
            value={settings.weeklyReports}
            onChange={(value) => setSettings((prev) => ({ ...prev, weeklyReports: value }))}
          />
          <ToggleRow
            icon={Bell}
            label="Sound Alerts"
            description="Audio feedback for real-time alerts"
            value={settings.soundAlerts}
            onChange={(value) => setSettings((prev) => ({ ...prev, soundAlerts: value }))}
          />
        </div>
      </Section>

      <Section title="App Preferences" icon={Palette}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[#EAF4FB] bg-[#F7FBFF] p-3">
              <label className="mb-1 block text-sm font-medium text-[#2F3A4A]">Language</label>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#D6EAF8] bg-white px-2.5 py-2">
                <Globe size={14} className="text-[#6FA8DC]" />
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="bg-transparent text-sm text-[#2F3A4A] outline-none"
                >
                  {[
                    "English",
                    "French",
                    "Spanish",
                    "German",
                    "Arabic",
                    "Chinese",
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-[#D6EAF8] bg-[#EAF4FB] p-3">
              <p className="text-sm font-semibold text-[#2F3A4A]">Display style</p>
              <p className="mt-1 text-xs text-[#6FA8DC]">
                Dashboard colors are now unified for consistent lessons and navigation.
              </p>
            </div>
          </div>

          <ToggleRow
            icon={Palette}
            label="Study Reminders"
            description="Prompt reminders before your preferred study window"
            value={studyReminders}
            onChange={setStudyReminders}
          />
          <ToggleRow
            icon={Palette}
            label="Compact Cards"
            description="Use tighter card spacing in dashboard lists"
            value={compactCards}
            onChange={setCompactCards}
          />
        </div>
      </Section>

      <Section title="Security" icon={Shield}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current password"
            className="rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            className="rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            className="rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-sm text-[#2F3A4A] outline-none focus:ring-2 focus:ring-[#EAF4FB]"
          />
        </div>

        <button
          type="button"
          onClick={() => void changePassword()}
          disabled={isChangingPassword}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-[#D6EAF8] bg-[#EAF4FB] px-4 py-2 text-sm font-semibold text-[#4A8CC0] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChangingPassword ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Shield size={15} />
          )}
          Update Password
        </button>
      </Section>

      <button
        type="button"
        onClick={() => void saveChanges()}
        disabled={isLoading || isSaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#51B8B8] to-[#6FA8DC] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading || isSaving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Save size={15} />
        )}
        Save Settings
      </button>
    </div>
  );
}
