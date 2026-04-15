import { Plus, MoreHorizontal, ChevronRight } from "lucide-react";

interface TeacherItem {
  id: string;
  name: string;
  subject: string;
  status: "active" | "away" | "inactive";
  lastActivity: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
}

const statusConfig = {
  active: { dot: "#22C55E", text: "#16A34A", bg: "#F0FDF4", label: "Active" },
  away: { dot: "#F59E0B", text: "#D97706", bg: "#FFFBEB", label: "Away" },
  inactive: { dot: "#CBD5E1", text: "#64748B", bg: "#F8FAFC", label: "Offline" },
};

interface TeachersTableProps {
  teachers: TeacherItem[];
}

export function TeachersTable({ teachers }: TeachersTableProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
        <div>
          <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Teacher Accounts
          </h3>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Manage and monitor teaching staff</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 transition-colors cursor-pointer px-3 py-1.5 rounded-lg"
            style={{ fontSize: "12px", fontWeight: 500, color: "#0277BD" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#01579B";
              e.currentTarget.style.background = "#E1F5FE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#0277BD";
              e.currentTarget.style.background = "transparent";
            }}
          >
            See full list
            <ChevronRight style={{ width: "14px", height: "14px" }} />
          </button>
          <button
            className="flex items-center gap-2 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            style={{ fontSize: "13px", fontWeight: 600, background: "#81D4FA" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#4FC3F7"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#81D4FA"}
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FAFBFC" }}>
              {["Name", "Subject", "Status", "Last Activity", ""].map((h) => (
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
            {teachers.map((teacher) => {
              const status = statusConfig[teacher.status as keyof typeof statusConfig];
              return (
                <tr
                  key={teacher.id}
                  className="hover:bg-slate-50/50 transition-colors"
                  style={{ borderTop: "1px solid #F4F5F8" }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: teacher.avatarBg }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: teacher.avatarColor }}>
                          {teacher.avatar}
                        </span>
                      </div>
                      <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {teacher.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-500" style={{ fontSize: "13px" }}>{teacher.subject}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: status.bg }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: status.text }}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-400" style={{ fontSize: "13px" }}>{teacher.lastActivity}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                      <MoreHorizontal className="text-slate-400" style={{ width: "15px", height: "15px" }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
