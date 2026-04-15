'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, GraduationCap, Mail, Phone, Trophy, User } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/http';

interface StudentProfilePageProps {
  studentId: string;
}

export function StudentProfilePage({ studentId }: StudentProfilePageProps) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof adminApi.getStudentDetail>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminApi.getStudentDetail(studentId);
        setProfile(response);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load student profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      load().catch(() => null);
    }
  }, [studentId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={14} /> Back to Students
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

              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  background:
                    profile.enrollment.status === 'APPROVED'
                      ? '#F0FDF4'
                      : profile.enrollment.status === 'REJECTED'
                        ? '#FFF1F2'
                        : '#FFFBEB',
                  color:
                    profile.enrollment.status === 'APPROVED'
                      ? '#16A34A'
                      : profile.enrollment.status === 'REJECTED'
                        ? '#E11D48'
                        : '#D97706',
                }}
              >
                {profile.enrollment.status ?? 'N/A'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <InfoCard icon={<User size={14} />} label="Age" value={profile.age !== null ? `${profile.age}` : 'N/A'} />
            <InfoCard
              icon={<GraduationCap size={14} />}
              label="Class"
              value={profile.enrollment.class?.name ?? 'Unassigned'}
            />
            <InfoCard
              icon={<Trophy size={14} />}
              label="Average Progress"
              value={`${profile.learning.averageProgress}%`}
            />
            <InfoCard icon={<Trophy size={14} />} label="Total XP" value={`${profile.learning.totalXp}`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
              <h3 className="text-slate-700 mb-3" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Profile Details
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
                <div className="flex items-center gap-2 text-slate-600">
                  <GraduationCap size={14} className="text-slate-400" />
                  Seat: {profile.enrollment.seatNumber ?? 'N/A'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
              <h3 className="text-slate-700 mb-3" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Learning Summary
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Completed Lessons" value={String(profile.learning.completedLessons)} />
                <MiniStat label="Tracked Lessons" value={String(profile.learning.trackedLessons)} />
                <MiniStat label="Enrollment" value={profile.enrollment.status ?? 'N/A'} />
                <MiniStat label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
