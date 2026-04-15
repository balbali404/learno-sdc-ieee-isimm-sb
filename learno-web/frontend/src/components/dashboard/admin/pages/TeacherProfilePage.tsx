'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Mail, Phone, Users, BookOpen } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/http';

interface TeacherProfilePageProps {
  teacherId: string;
}

export function TeacherProfilePage({ teacherId }: TeacherProfilePageProps) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof adminApi.getTeacherDetail>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminApi.getTeacherDetail(teacherId);
        setProfile(response);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load teacher profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (teacherId) {
      load().catch(() => null);
    }
  }, [teacherId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={14} /> Back to Teachers
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading profile...</div>
      ) : null}

      {!isLoading && profile ? (
        <>
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EEF0FD] text-[#6366F1] flex items-center justify-center font-bold">
                  {profile.fullName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-slate-800" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {profile.fullName}
                  </h2>
                  <p className="text-slate-500 text-sm">{profile.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card label="Classes" value={String(profile.summary.classesCount)} icon={<Users size={14} />} />
            <Card label="Timetable Entries" value={String(profile.summary.timetableEntriesCount)} icon={<BookOpen size={14} />} />
            <Card label="Sessions" value={String(profile.summary.sessionsCount)} icon={<CalendarDays size={14} />} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
              <h3 className="text-slate-700 mb-3" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Contact & Profile
              </h3>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {profile.profile.phone ?? 'No phone'}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays size={14} className="text-slate-400" />
                  Created {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
              <h3 className="text-slate-700 mb-3" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Assigned Timetable
              </h3>

              {profile.timetable.length === 0 ? (
                <p className="text-sm text-slate-500">No timetable entries.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-auto">
                  {profile.timetable.map((entry) => (
                    <div key={entry.id} className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                      <p className="text-sm font-medium text-slate-700">
                        {entry.day} · {entry.startTime}-{entry.endTime}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.class.name} ({entry.class.studentsCount} students) · {entry.subject.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #ECEEF4' }}>
      <div className="inline-flex w-7 h-7 rounded-lg items-center justify-center text-sky-700 bg-sky-50 border border-sky-100">
        {icon}
      </div>
      <p className="mt-2 text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-slate-800 text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}
