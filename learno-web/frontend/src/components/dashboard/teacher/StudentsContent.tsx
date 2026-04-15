'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { ApiError, teacherApi } from '@/lib/api';
import type { TeacherStudentEnrollment } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

const statusClassMap: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700 border-green-100',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export function StudentsContent() {
  const { token } = useStoredAuth();
  const [students, setStudents] = useState<TeacherStudentEnrollment[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadStudents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await teacherApi.getStudents();
        setStudents(response ?? []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load students.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents().catch(() => null);
  }, [token]);

  const filtered = students.filter((student) => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return true;
    }

    return (
      student.student.fullName.toLowerCase().includes(term) ||
      (student.class?.name ?? '').toLowerCase().includes(term) ||
      (student.student.email ?? '').toLowerCase().includes(term)
    );
  });

  const approvedCount = students.filter((item) => item.status === 'APPROVED').length;
  const pendingCount = students.filter((item) => item.status === 'PENDING').length;
  const rejectedCount = students.filter((item) => item.status === 'REJECTED').length;

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Students</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load student records.</p>
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
      <div>
        <h1 className="text-xl font-bold text-slate-800">Students</h1>
        <p className="text-sm text-slate-500 mt-1">
          Synced from `/teacher/students`. Missing analytics defaults to zero.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-sm text-green-700 mt-1">Approved</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-sm text-amber-700 mt-1">Pending</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-sm text-red-700 mt-1">Rejected</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, class, email..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30 focus:border-[#54C3EF]"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading students...
          </div>
        ) : null}

        {!isLoading && filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No students found.
          </div>
        ) : null}

        {!isLoading && filtered.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Student', 'Email', 'Class', 'Seat', 'Status', 'Attention'].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const status = item.status ?? 'APPROVED';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                          {initials(item.student.fullName)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {item.student.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {item.student.email ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {item.class?.name ?? 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {item.seatNumber ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClassMap[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (item.attentionScore ?? 0) >= 75
                                ? 'bg-emerald-500'
                                : (item.attentionScore ?? 0) >= 55
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, item.attentionScore ?? 0))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {Math.max(0, Math.min(100, Math.round(item.attentionScore ?? 0)))}%
                        </span>
                      </div>
                      {item.vision ? (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {item.vision.lowEngagement ? 'Needs support' : 'Stable'}
                          {item.vision.trend ? ` · ${item.vision.trend}` : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-300">No vision data</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
