'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError, teacherApi } from '@/lib/api';
import type { LearnoSession } from '@/lib/api/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  Clock, Users, Brain, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, RotateCcw, Search,
  Sparkles, ShieldCheck, Eye, BookOpen, BarChart2,
  Send, Pencil, X, Download,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type ApprovalStatus = 'approved' | 'pending' | 'rejected';

interface Session {
  id: string;
  date: string;
  dayLabel: string;
  class: string;
  duration: string;
  topic: string;
  avgAttention: number;
  avgEngagement: number;
  studentsPresent: number;
  studentsTotal: number;
  alertsTriggered: number;
  envScore: number;
  approvalStatus: ApprovalStatus;
  dropMin: number | null;
  talkRatio: number;
  flaggedStudents: string[];
  aiSummary: string;
  engagementCurve: { t: string; e: number; a: number }[];
  topStudents: { name: string; score: number; avatar: string }[];
  classEngagementAvg?: number | null;
  classEngagementMin?: number | null;
  classEngagementMax?: number | null;
  visionStudentCount?: number;
  visionLowEngagementCount?: number;
}

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const formatDayLabel = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
};

const minutesLabel = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) return '0 min';
  return `${minutes} min`;
};

const deriveApprovalStatus = (status: string): ApprovalStatus => {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
};

const makeEngagementCurve = (engagement?: number | null) => {
  const base = Math.max(0, Math.min(100, Math.round(engagement ?? 0)));
  const curve = [
    { t: '0m', e: Math.max(40, base - 8), a: Math.max(35, base - 12) },
    { t: '10m', e: Math.max(45, base + 2), a: Math.max(40, base - 4) },
    { t: '20m', e: Math.max(42, base - 6), a: Math.max(38, base - 8) },
    { t: '30m', e: Math.max(45, base - 2), a: Math.max(40, base - 5) },
    { t: '40m', e: Math.max(45, base + 1), a: Math.max(42, base - 3) },
  ];
  return curve.map((point) => ({
    ...point,
    e: Math.min(100, point.e),
    a: Math.min(100, point.a),
  }));
};

// ─── Approval Badge ────────────────────────────────────────────────────────

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const cfg = {
    approved: { label: 'Approved',          cls: 'bg-green-50 text-green-700 border-green-100'   },
    pending:  { label: 'Pending Review',    cls: 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' },
    rejected: { label: 'Revision Requested', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  }[status];
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Inline Summary ────────────────────────────────────────────────────────

function InlineSummaryPanel({ session }: { session: Session }) {
  const [status, setStatus] = useState<ApprovalStatus>(session.approvalStatus);
  const [editing, setEditing] = useState(false);
  const [text, setText]     = useState(session.aiSummary);
  const [draft, setDraft]   = useState(session.aiSummary);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-4">
      <div className={`px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 ${status === 'approved' ? 'bg-green-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
            {status === 'approved' ? <ShieldCheck size={15} className="text-green-600" />
              : status === 'rejected' ? <RotateCcw size={15} className="text-slate-400" />
              : <Sparkles size={15} className="text-[#54C3EF]" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">AI Lesson Summary</span>
              <ApprovalBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {status === 'approved' ? 'Published to student/guardian report'
                : status === 'rejected' ? 'Not published — revision requested'
                : 'Draft only — not visible to students yet'}
            </p>
          </div>
        </div>
        {status === 'pending' && !editing && (
          <button onClick={() => { setDraft(text); setEditing(true); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all">
            <Pencil size={11} /> Edit
          </button>
        )}
        {status !== 'pending' && (
          <button onClick={() => { setStatus('pending'); setText(session.aiSummary); setDraft(session.aiSummary); setEditing(false); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all">
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>
      <div className="px-4 pb-4 pt-3">
        {status === 'pending' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-3">
            <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700"><span className="font-semibold">Requires your approval</span> before sharing with students or guardians.</p>
          </div>
        )}
        {editing ? (
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={6}
            className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30 focus:border-[#54C3EF] transition-all" />
        ) : (
          <div className={`text-sm text-slate-700 leading-relaxed whitespace-pre-line rounded-lg p-3.5 border ${
            status === 'approved' ? 'bg-green-50/40 border-green-100' :
            status === 'rejected' ? 'bg-slate-50 border-slate-100 opacity-60' :
            'bg-slate-50 border-slate-100'
          }`}>{text}</div>
        )}
        {status === 'pending' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            {editing && (
              <button onClick={() => { setEditing(false); setDraft(text); }}
                className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg transition-all hover:border-slate-300">
                <X size={12} /> Cancel
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setStatus('rejected')}
                className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-all">
                <RotateCcw size={12} /> Request Revision
              </button>
              <button onClick={() => { if (editing) { setText(draft); setEditing(false); } setStatus('approved'); }}
                className="flex items-center gap-1.5 text-xs text-white font-medium bg-[#54C3EF] hover:bg-[#38b6e8] px-4 py-1.5 rounded-lg transition-all">
                <Send size={12} /> {editing ? 'Save & Approve' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session Card ──────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(session.approvalStatus === 'pending');
  const attnColor = session.avgAttention >= 80 ? 'text-green-600'  : session.avgAttention >= 65 ? 'text-amber-600'  : 'text-red-500';
  const attnBar   = session.avgAttention >= 80 ? 'bg-green-400'    : session.avgAttention >= 65 ? 'bg-amber-400'    : 'bg-red-400';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${session.approvalStatus === 'pending' ? 'border-amber-200' : 'border-slate-100'}`}>
      <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#54C3EF] flex flex-col items-center justify-center text-white">
            <span className="text-xs text-white/80 leading-none">{session.date.slice(4, 7)}</span>
            <span className="text-lg font-bold leading-none mt-0.5">{session.date.slice(8, 10)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{session.class}</span>
              <span className="text-xs text-slate-400">{session.dayLabel}</span>
              <ApprovalBadge status={session.approvalStatus} />
            </div>
            <h3 className="font-semibold text-slate-800 truncate">{session.topic}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{session.duration}</span>
              <span className="flex items-center gap-1 text-xs text-slate-400"><Users size={11} />{session.studentsPresent}/{session.studentsTotal}</span>
              {session.alertsTriggered > 0
                ? <span className="flex items-center gap-1 text-xs text-amber-500"><AlertCircle size={11} />{session.alertsTriggered} alerts</span>
                : <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle size={11} />No alerts</span>}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-right"><p className="text-xs text-slate-400">Attention</p><p className={`font-bold ${attnColor}`}>{session.avgAttention}%</p></div>
              <div className="text-right"><p className="text-xs text-slate-400">Engagement</p><p className="font-bold text-[#54C3EF]">{session.avgEngagement}%</p></div>
            </div>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${attnBar}`} style={{ width: `${session.avgAttention}%` }} />
            </div>
          </div>
          <div className="flex-shrink-0 text-slate-400">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
            {[
              { label: 'Avg Attention',  value: `${session.avgAttention}%`  },
              { label: 'Avg Engagement', value: `${session.avgEngagement}%` },
              {
                label: 'Vision Avg',
                value:
                  typeof session.classEngagementAvg === 'number'
                    ? `${Math.round(session.classEngagementAvg * 100)}%`
                    : '—',
              },
              { label: 'Talk Ratio',     value: `${session.talkRatio}%`     },
              { label: 'Env Score',      value: `${session.envScore}/100`   },
              {
                label: 'Low Focus',
                value:
                  session.visionStudentCount && session.visionStudentCount > 0
                    ? `${session.visionLowEngagementCount ?? 0}/${session.visionStudentCount}`
                    : '0',
              },
              ...(session.dropMin ? [{ label: 'Attn Drop', value: `Min ${session.dropMin}` }] : []),
            ].map(m => (
              <div key={m.label} className="flex-1 min-w-0 bg-slate-50 rounded-lg border border-slate-100 px-3 py-2.5">
                <p className="text-xs text-slate-400">{m.label}</p>
                <p className="font-bold text-slate-800 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-600 mb-3">Engagement & Attention Curve</p>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={session.engagementCurve} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`eG-lh-${session.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#54C3EF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#54C3EF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={`aG-lh-${session.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(value, name) => [`${value}%`, name ?? '']} />
                  <Area type="monotone" dataKey="e" stroke="#54C3EF" strokeWidth={2} fill={`url(#eG-lh-${session.id})`} dot={false} name="Engagement" />
                  <Area type="monotone" dataKey="a" stroke="#94a3b8" strokeWidth={2} fill={`url(#aG-lh-${session.id})`} dot={false} name="Attention" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#54C3EF]" /><span className="text-xs text-slate-400">Engagement</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /><span className="text-xs text-slate-400">Attention</span></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-600 mb-3">Top Performers</p>
              <div className="space-y-2.5">
                {session.topStudents.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{s.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{s.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#54C3EF] rounded-full" style={{ width: `${s.score}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#54C3EF]">{s.score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {session.flaggedStudents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-amber-600 mb-1.5">Needed Support</p>
                  {session.flaggedStudents.map(name => <p key={name} className="text-xs text-slate-400">· {name}</p>)}
                </div>
              )}
            </div>
          </div>

          <InlineSummaryPanel session={session} />

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">{session.date} · {session.class}</p>
            <button className="flex items-center gap-1.5 text-xs text-[#54C3EF] font-medium hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-100">
              <Download size={12} /> Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trend Panel ───────────────────────────────────────────────────────────

function TrendPanel({ data }: { data: Session[] }) {
  const trendData = data.slice().reverse().map((s) => ({
    label: s.dayLabel || s.date,
    engagement: s.avgEngagement,
    attention: s.avgAttention,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-800">Performance Trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">Engagement & attention across recent sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#54C3EF]" /><span className="text-xs text-slate-400">Engagement</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /><span className="text-xs text-slate-400">Attention</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Bar dataKey="engagement" fill="#54C3EF" radius={[3, 3, 0, 0]} name="Engagement" />
          <Bar dataKey="attention"  fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Attention" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function LessonHistoryContent() {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | ApprovalStatus>('All');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teacherApi.getLessonHistory();
      const mapped: Session[] = response.map((session): Session => {
        const attention = Math.max(0, Math.min(100, Math.round(session.studentRatio ?? 0)));
        const engagement = Math.max(0, Math.min(100, Math.round(session.engagementScore ?? 0)));
        const startLabel = session.actualStart ?? session.createdAt ?? null;
        const dateLabel = formatDate(startLabel);
        const dayLabel = formatDayLabel(startLabel);

        return {
          id: session.id,
          date: dateLabel || dayLabel || '—',
          dayLabel: dayLabel || dateLabel || '—',
          class: session.class?.name ?? 'General',
          duration: minutesLabel(session.durationMinutes),
          topic: session.subject?.name ?? 'Session Summary',
          avgAttention: attention,
          avgEngagement: engagement,
          studentsPresent: 0,
          studentsTotal: 0,
          alertsTriggered: session._count?.alerts ?? 0,
          envScore: Math.max(0, Math.min(100, Math.round((attention + engagement) / 2))),
          approvalStatus: session.status === 'COMPLETED' ? 'approved' : 'pending',
          dropMin: null,
          talkRatio: Math.max(0, Math.min(100, Math.round(session.teacherRatio ?? 0))),
          flaggedStudents: [],
          aiSummary:
            session.engagementBand
              ? `Engagement band: ${session.engagementBand}. Focus on follow-up activities for next session.`
              : 'Session summary will appear after analysis completes.',
          engagementCurve: makeEngagementCurve(session.engagementScore),
          topStudents: [],
          classEngagementAvg: session.visionAnalysis?.classEngagementAvg ?? null,
          classEngagementMin: session.visionAnalysis?.classEngagementMin ?? null,
          classEngagementMax: session.visionAnalysis?.classEngagementMax ?? null,
          visionStudentCount: session.visionAnalysis?.classStudentCount ?? 0,
          visionLowEngagementCount: session.visionAnalysis?.lowEngagementCount ?? 0,
        };
      });

      setSessions(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load lesson history.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const classList = ['All', ...Array.from(new Set(sessions.map((s) => s.class)))];
  const pendingCount = sessions.filter((s) => s.approvalStatus === 'pending').length;
  const avgAttention = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.avgAttention, 0) / sessions.length)
    : 0;
  const avgEngagement = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.avgEngagement, 0) / sessions.length)
    : 0;
  const approvedCount = sessions.filter((s) => s.approvalStatus === 'approved').length;

  const filtered = sessions.filter((s) => {
    const matchSearch =
      s.topic.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'All' || s.class === filterClass;
    const matchStatus = filterStatus === 'All' || s.approvalStatus === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Lesson History</h1>
          <p className="text-slate-400 text-sm mt-1">Review past sessions · approve AI summaries · track performance</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-700">{pendingCount} summar{pendingCount === 1 ? 'y' : 'ies'} awaiting approval</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BookOpen,    label: 'Total Sessions',     value: `${sessions.length}`,           sub: 'Last 7 days'   },
          { icon: Brain,       label: 'Avg Attention',      value: `${avgAttention}%`,             sub: 'All sessions'  },
          { icon: BarChart2,   label: 'Avg Engagement',     value: `${avgEngagement}%`,            sub: 'All sessions'  },
          { icon: ShieldCheck, label: 'Summaries Approved', value: `${approvedCount}/${sessions.length}`, sub: `${pendingCount} pending` },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <item.icon size={17} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="font-bold text-slate-800 text-lg leading-tight">{item.value}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <TrendPanel data={sessions} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic or class…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#54C3EF]/30 focus:border-[#54C3EF] transition-all" />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
          {classList.map(cls => (
            <button key={cls} onClick={() => setFilterClass(cls)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${filterClass === cls ? 'bg-[#54C3EF] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {cls}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
          {(['All', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-all ${filterStatus === s ? 'bg-[#54C3EF] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {s === 'pending' ? 'Pending' : s === 'rejected' ? 'Revision' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-sm text-slate-500">
          Loading lesson history...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-rose-200 p-12 text-center text-sm text-rose-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Eye size={28} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No sessions match your filters</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}
