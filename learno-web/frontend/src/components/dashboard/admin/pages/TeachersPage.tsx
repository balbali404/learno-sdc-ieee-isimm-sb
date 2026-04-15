'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreHorizontal, Mail, Phone, Star, Eye, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { schoolApi } from "@/lib/api";
import { ApiError } from "@/lib/api/http";

type TeacherRow = {
  id: string;
  name: string;
  subject: string;
  classes: number;
  students: number;
  rating: number;
  status: "active" | "away" | "inactive";
  email: string;
  phone: string | null;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  experience: string;
  lastActivity: string;
  schoolId?: string | null;
  profile?: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt?: string;
};

const emptyStats = {
  totalTeachers: 0,
  classesToday: 0,
  avgRating: 0,
  newThisMonth: 0,
};

const statusConfig: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  active: { dot: "#22C55E", bg: "#F0FDF4", color: "#16A34A", label: "Active" },
  away: { dot: "#F59E0B", bg: "#FFFBEB", color: "#D97706", label: "Away" },
  inactive: { dot: "#CBD5E1", bg: "#F8FAFC", color: "#64748B", label: "Offline" },
};

export function TeachersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const load = async () => {
    const response = await adminApi.getTeachers();
    setTeachers(response.teachers);
    setStats(response.stats);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load teachers.");
        }
      }
    };

    run().catch(() => null);
  }, []);

  const createTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);
    setGeneratedPassword(null);

    try {
      const response = await schoolApi.createTeacher({
        fullName: newTeacherName.trim(),
        email: newTeacherEmail.trim(),
      });

      setGeneratedPassword(response.generatedPassword);
      setActionMessage("Teacher created successfully.");
      setNewTeacherName("");
      setNewTeacherEmail("");
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create teacher.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Teachers", value: String(stats.totalTeachers), sub: "Active faculty", color: "#6366F1", bg: "#EEF0FD" },
          { label: "Classes Today", value: String(stats.classesToday), sub: "In session now", color: "#14B8A6", bg: "#F0FDF9" },
          { label: "Avg. Rating", value: stats.avgRating.toFixed(1), sub: "Teacher satisfaction", color: "#F59E0B", bg: "#FFFBEB" },
          { label: "New This Month", value: String(stats.newThisMonth), sub: "Recently onboarded", color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ECEEF4" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="text-slate-800" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
            <p className="text-slate-600 mt-1" style={{ fontSize: "13px", fontWeight: 500 }}>{s.label}</p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {generatedPassword ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Generated password: <span className="font-semibold">{generatedPassword}</span>
        </div>
      ) : null}

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <h3 className="text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 600 }}>All Teachers</h3>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: "14px", height: "14px" }} />
              <input
                type="text"
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl focus:outline-none"
                style={{ background: "#F4F5F8", border: "1px solid #ECEEF4", fontSize: "13px", width: "200px" }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCreateTeacherModal(true)}
              className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              style={{ fontSize: "13px", fontWeight: 600, background: "#81D4FA" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4FC3F7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#81D4FA"}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Add Teacher
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFBFC" }}>
                {["Teacher", "Subject", "Classes", "Students", "Rating", "Status", "Contact", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-slate-400 uppercase"
                    style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const status = statusConfig[t.status];
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors" style={{ borderTop: "1px solid #F4F5F8" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.avatarBg }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: t.avatarColor }}>{t.avatar}</span>
                        </div>
                        <div>
                          <p className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</p>
                          <p className="text-slate-400" style={{ fontSize: "11.5px" }}>{t.experience} experience</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500" style={{ fontSize: "13px" }}>{t.subject}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{t.classes}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-600" style={{ fontSize: "13px" }}>{t.students}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Star style={{ width: "13px", height: "13px", color: "#F59E0B", fill: "#F59E0B" }} />
                        <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{t.rating}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: status.bg }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: status.color }}>{status.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          style={{ background: "transparent" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#E1F5FE"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          title={t.email}
                        >
                          <Mail style={{ width: "14px", height: "14px", color: "#0277BD" }} />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer" title={t.phone ?? "No phone available"}>
                          <Phone style={{ width: "14px", height: "14px", color: "#64748B" }} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative group inline-block">
                        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                          <MoreHorizontal className="text-slate-400" style={{ width: "15px", height: "15px" }} />
                        </button>

                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute right-0 top-8 z-20 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/teachers/${t.id}`)}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={13} /> View Profile
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4" style={{ borderTop: "1px solid #ECEEF4", background: "#FAFBFC" }}>
          <p className="text-slate-400" style={{ fontSize: "13px" }}>Showing {filtered.length} of {teachers.length} teachers</p>
        </div>
      </div>

      {showCreateTeacherModal ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreateTeacherModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5"
            style={{ border: "1px solid #ECEEF4" }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-slate-700" style={{ fontSize: "1rem", fontWeight: 700 }}>
              Create Teacher
            </h3>

            <div className="mt-4 space-y-3">
              <input
                value={newTeacherName}
                onChange={(event) => setNewTeacherName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ border: "1px solid #ECEEF4", background: "#F8FAFC" }}
              />
              <input
                type="email"
                value={newTeacherEmail}
                onChange={(event) => setNewTeacherEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ border: "1px solid #ECEEF4", background: "#F8FAFC" }}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateTeacherModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createTeacher()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
