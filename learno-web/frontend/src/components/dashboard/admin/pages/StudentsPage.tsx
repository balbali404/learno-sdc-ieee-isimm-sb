'use client';

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter, ChevronRight, MoreHorizontal, Eye, UserMinus, UserRoundCheck, XCircle } from "lucide-react";
import { adminApi, schoolApi } from "@/lib/api";
import { ApiError } from "@/lib/api/http";

const tabs = ["All Students", "Active", "At Risk", "Flagged"];

type StudentRow = {
  id: string;
  name: string;
  email: string;
  className: string;
  classId?: string | null;
  grade: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  status: "active" | "risk" | "flagged";
  engagement: number;
  attendance: number;
  flag: string | null;
  age?: number | null;
  enrollmentStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  seatNumber?: number | null;
  profile?: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt?: string;
};

const emptyStats = {
  total: 0,
  active: 0,
  atRisk: 0,
  flagged: 0,
};

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "#F0FDF4", color: "#16A34A", label: "Active" },
  risk: { bg: "#FFFBEB", color: "#D97706", label: "At Risk" },
  flagged: { bg: "#FFF1F2", color: "#E11D48", label: "Flagged" },
};

export function StudentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Students");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingEnrollments, setPendingEnrollments] = useState<
    Array<{
      id: string;
      student: { id: string; fullName: string; email: string; dateOfBirth?: string | null };
      class: { id: string; name: string };
      seatNumber?: number | null;
    }>
  >([]);
  const [seatNumbers, setSeatNumbers] = useState<Record<string, string>>({});

  const load = async () => {
    const [studentsResponse, pendingResponse] = await Promise.all([
      adminApi.getStudents(),
      schoolApi.getPendingEnrollments().catch(() => ({ enrollments: [], total: 0 })),
    ]);

    setStudents(
      studentsResponse.students.map((student) => ({
        ...student,
      })),
    );
    setStats(studentsResponse.stats);
    setPendingEnrollments(pendingResponse.enrollments);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load students.");
        }
      }
    };

    run().catch(() => null);
  }, []);

  const removeStudent = async (studentId: string) => {
    if (!window.confirm("Remove this student account?")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);

    try {
      await schoolApi.removeStudent(studentId);
      setActionMessage("Student removed successfully.");
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to remove student.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollmentAction = async (enrollmentId: string, action: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setError(null);
    setActionMessage(null);

    try {
      let seatNumber: number | undefined;
      if (action === "APPROVED") {
        const seatRaw = seatNumbers[enrollmentId] ?? "1";
        const parsed = Number(seatRaw);
        if (!Number.isFinite(parsed) || parsed < 1) {
          setError("Seat number must be at least 1.");
          setIsSubmitting(false);
          return;
        }
        seatNumber = Math.floor(parsed);
      }

      await schoolApi.handleEnrollment({ enrollmentId, action, seatNumber });
      setActionMessage(action === "APPROVED" ? "Enrollment approved." : "Enrollment rejected.");
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to handle enrollment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchTab =
      activeTab === "All Students" ||
              (activeTab === "Active" && s.status === "active") ||
              (activeTab === "At Risk" && s.status === "risk") ||
              (activeTab === "Flagged" && s.status === "flagged");
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.className.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Total Students", value: String(stats.total), sub: "Enrolled this year", color: "#6366F1", bg: "#EEF0FD" },
             { label: "Active", value: String(stats.active), sub: "Attending regularly", color: "#16A34A", bg: "#F0FDF4" },
             { label: "At Risk", value: String(stats.atRisk), sub: "Need monitoring", color: "#D97706", bg: "#FFFBEB" },
             { label: "Flagged", value: String(stats.flagged), sub: "Require intervention", color: "#E11D48", bg: "#FFF1F2" },
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

      {/* Pending enrollments */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <h3 className="text-slate-700" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Pending Enrollment Approvals
          </h3>
        </div>

        {pendingEnrollments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">No pending enrollments.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F4F5F8" }}>
            {pendingEnrollments.map((item) => (
              <div key={item.id} className="px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.student.fullName}</p>
                  <p className="text-xs text-slate-500">{item.class.name} · {item.student.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={seatNumbers[item.id] ?? "1"}
                    onChange={(event) =>
                      setSeatNumbers((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleEnrollmentAction(item.id, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <UserRoundCheck size={12} /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleEnrollmentAction(item.id, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                style={{
                  fontSize: "13px",
                  fontWeight: activeTab === tab ? 600 : 500,
                  background: activeTab === tab ? "#EEF0FD" : "transparent",
                  color: activeTab === tab ? "#6366F1" : "#64748B",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ width: "14px", height: "14px" }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl focus:outline-none transition-all"
                style={{ background: "#F4F5F8", border: "1px solid #ECEEF4", fontSize: "13px", width: "180px" }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              style={{ fontSize: "13px", border: "1px solid #ECEEF4" }}
            >
              <Filter style={{ width: "14px", height: "14px" }} />
              Filter
            </button>
            <button
              className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              style={{ fontSize: "13px", fontWeight: 600, background: "#81D4FA" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#4FC3F7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#81D4FA"}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Add Student
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFBFC" }}>
                {["Student", "Class", "Status", "Engagement", "Attendance", "Flag", ""].map((h) => (
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
              {filtered.map((s) => {
                const badge = statusBadge[s.status];
                const engColor = s.engagement >= 75 ? "#6366F1" : s.engagement >= 55 ? "#F59E0B" : "#F43F5E";
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors" style={{ borderTop: "1px solid #F4F5F8" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.avatarBg }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: s.avatarColor }}>{s.avatar}</span>
                        </div>
                        <div>
                          <p className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{s.name}</p>
                          <p className="text-slate-400" style={{ fontSize: "12px" }}>{s.grade}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                        <span className="text-slate-500" style={{ fontSize: "13px" }}>{s.className}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full px-2.5 py-1" style={{ fontSize: "11.5px", fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: "#F1F3F7" }}>
                          <div className="h-full rounded-full" style={{ width: `${s.engagement}%`, background: engColor }} />
                        </div>
                        <span className="text-slate-600" style={{ fontSize: "12px", fontWeight: 600 }}>{s.engagement}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-600" style={{ fontSize: "13px", fontWeight: 500 }}>{s.attendance}%</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.flag ? (
                        <span className="rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 500, background: "#FFFBEB", color: "#D97706" }}>
                          {s.flag}
                        </span>
                      ) : (
                        <span className="text-slate-300" style={{ fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative group inline-block">
                        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                        <MoreHorizontal className="text-slate-400" style={{ width: "15px", height: "15px" }} />
                        </button>

                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/students/${s.id}`)}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={13} /> View Profile
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void removeStudent(s.id)}
                            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          >
                            <UserMinus size={13} /> Remove Student
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

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #ECEEF4", background: "#FAFBFC" }}>
           <p className="text-slate-400" style={{ fontSize: "13px" }}>Showing {filtered.length} of {students.length} students</p>
           <button
            className="flex items-center gap-1 cursor-pointer transition-colors"
            style={{ fontSize: "13px", fontWeight: 600, color: "#0277BD" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#01579B"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#0277BD"}
          >
            View all records
            <ChevronRight style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
