'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ChevronDown,
  Info,
  Loader2,
  Send,
  Shield,
} from 'lucide-react';
import { ApiError, guardianApi, messagesApi } from '@/lib/api';
import type { ConversationItem, GuardianStudent } from '@/lib/api/types';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';
import { useStoredAuth } from '@/hooks/useStoredAuth';

interface ChildSnapshot {
  student: GuardianStudent;
  concentrationScore: number;
  attentionScore: number;
  classEngagementScore: number;
  averageProgress: number;
  completedLessons: number;
  sessionCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  guidance: string;
  themeCondition: string;
}

const QUICK_REPLIES = [
  'Thank you for the update.',
  'I will support this at home tonight.',
  'Can we schedule a short call this week?',
];

const toPct = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const formatMessageDate = (isoDate?: string | null) => {
  if (!isoDate) {
    return 'No date';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return 'Unknown date';
  }
};

const concentrationColor = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-sky-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
};

const concentrationLabel = (score: number) => {
  if (score >= 80) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Follow-up';
  return 'Needs Support';
};

const trendLabel = (trend: ChildSnapshot['trend']) => {
  if (trend === 'UP') return 'Improving';
  if (trend === 'DOWN') return 'Dropping';
  return 'Stable';
};

const trendTextColor = (trend: ChildSnapshot['trend']) => {
  if (trend === 'UP') return 'text-emerald-700';
  if (trend === 'DOWN') return 'text-rose-700';
  return 'text-slate-600';
};

const concentrationStatusColor = (score: number) => {
  if (score >= 70) return 'text-emerald-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-rose-700';
};

const concentrationStatusText = (score: number) => {
  if (score >= 70) return 'On track';
  if (score >= 50) return 'Watch closely';
  return 'Needs support';
};

const conditionLabelMap: Record<string, string> = {
  ADHD: 'ADHD',
  ASD: 'ASD',
  DYSLEXIA: 'Dyslexia',
  DYSCALCULIA: 'Dyscalculia',
  ANXIETY: 'Anxiety',
  DEPRESSION: 'Depression',
  DEFAULT: 'Default',
};

const conditionTone: Record<string, string> = {
  ADHD: 'bg-sky-50 text-sky-700 border-sky-100',
  ASD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DYSLEXIA: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  DYSCALCULIA: 'bg-orange-50 text-orange-700 border-orange-100',
  ANXIETY: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  DEPRESSION: 'bg-rose-50 text-rose-700 border-rose-100',
  DEFAULT: 'bg-slate-100 text-slate-700 border-slate-200',
};

const toConditionCode = (value: string | null | undefined): string => {
  const normalized = (value ?? 'DEFAULT').toUpperCase();

  if (normalized === 'AUTISM' || normalized === 'AUTISM_SUPPORT' || normalized === 'ASC') {
    return 'ASD';
  }

  if (normalized in conditionLabelMap) {
    return normalized;
  }

  return 'DEFAULT';
};

export function Dashboard() {
  const { token } = useStoredAuth();
  const { guardianStats } = useRealtimeDashboard();

  const [childSnapshots, setChildSnapshots] = useState<ChildSnapshot[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('ALL');
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [teacherConversations, setTeacherConversations] = useState<ConversationItem[]>(
    [],
  );
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendingConversationId, setSendingConversationId] = useState<string | null>(null);
  const [justSentConversationId, setJustSentConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setChildSnapshots([]);
      setIsLoadingChildren(false);
      return;
    }

    const loadChildren = async () => {
      setIsLoadingChildren(true);
      setChildrenError(null);

      try {
        const studentsResponse = await guardianApi.getStudents();
        const students = studentsResponse.students ?? [];

        if (students.length === 0) {
          setChildSnapshots([]);
          return;
        }

        const progressResults = await Promise.allSettled(
          students.map((student) => guardianApi.getStudentProgress(student.id)),
        );

        const conditionResults = await Promise.allSettled(
          students.map((student) => guardianApi.getStudentThemeCondition(student.id)),
        );

        const snapshots = students.map((student, index) => {
          const progressResult = progressResults[index];

          if (progressResult.status !== 'fulfilled') {
            return {
              student,
              concentrationScore: 35,
              attentionScore: 40,
              classEngagementScore: 38,
              averageProgress: 30,
              completedLessons: 0,
              sessionCount: 0,
              trend: 'STABLE',
              guidance:
                'No classroom concentration data yet. Ask your child to join sessions consistently this week.',
              themeCondition: 'DEFAULT',
            } satisfies ChildSnapshot;
          }

          const progress = progressResult.value;
          const recentLessons = progress.recentLessons ?? [];
          const completedLessons = recentLessons.filter((lesson) => {
            const status = (lesson.status ?? '').toUpperCase();
            return status === 'COMPLETED' || status === 'APPROVED' || (lesson.progressPercent ?? 0) >= 100;
          }).length;

          const averageProgress = recentLessons.length
            ? Math.round(
                recentLessons.reduce((sum, lesson) => sum + (lesson.progressPercent ?? 0), 0) /
                  recentLessons.length,
              )
            : 0;

          const concentrationFromApi = progress.classConcentration;
          const streak = progress.xp?.currentStreak ?? progress.xp?.longestStreak ?? 0;
          const fallbackConcentration = toPct(
            averageProgress * 0.55 + completedLessons * 7 + Math.min(streak, 10) * 3,
          );
          const concentrationScore = toPct(
            concentrationFromApi?.concentrationScore ?? fallbackConcentration,
          );
          const attentionScore = toPct(
            concentrationFromApi?.attentionScore ?? concentrationScore - 4,
          );
          const classEngagementScore = toPct(
            concentrationFromApi?.classEngagementScore ??
              averageProgress * 0.75 + completedLessons * 5,
          );
          const sessionCount = concentrationFromApi?.sessionCount ?? recentLessons.length;
          const rawTrend = concentrationFromApi?.trend;
          const trend: ChildSnapshot['trend'] =
            rawTrend === 'UP' || rawTrend === 'DOWN' || rawTrend === 'STABLE'
              ? rawTrend
              : concentrationScore >= 70
                ? 'UP'
                : concentrationScore < 50
                  ? 'DOWN'
                  : 'STABLE';

          const firstName = student.fullName.split(' ')[0] ?? student.fullName;
          const guidance =
            concentrationScore >= 75
              ? `${firstName} stays focused in class. Keep a consistent sleep routine to sustain concentration.`
              : concentrationScore >= 50
                ? `${firstName} is moderately focused. A short review before class can improve attention.`
                : `${firstName} needs concentration support. Start with small goals and fewer distractions during study time.`;

          const conditionResult = conditionResults[index];
          const rawCondition =
            conditionResult && conditionResult.status === 'fulfilled'
              ? conditionResult.value.rawCondition ?? conditionResult.value.condition
              : 'DEFAULT';
          const themeCondition = toConditionCode(rawCondition);

          return {
            student,
            concentrationScore,
            attentionScore,
            classEngagementScore,
            averageProgress: toPct(averageProgress),
            completedLessons,
            sessionCount,
            trend,
            guidance,
            themeCondition,
          } satisfies ChildSnapshot;
        });

        setChildSnapshots(snapshots);
      } catch (err) {
        if (err instanceof ApiError) {
          setChildrenError(err.message);
        } else {
          setChildrenError('Unable to load children concentration data right now.');
        }
      } finally {
        setIsLoadingChildren(false);
      }
    };

    loadChildren().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setTeacherConversations([]);
      setIsLoadingMessages(false);
      return;
    }

    const loadTeacherMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError(null);

      try {
        const conversations = await messagesApi.getConversations();
        const teacherOnly = conversations
          .filter((conversation) => conversation.otherUser.role === 'TEACHER')
          .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          })
          .slice(0, 3);

        setTeacherConversations(teacherOnly);
        setMessageDrafts((current) => {
          const next = { ...current };
          for (const conversation of teacherOnly) {
            if (!(conversation.id in next)) {
              next[conversation.id] = '';
            }
          }
          return next;
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setMessagesError(err.message);
        } else {
          setMessagesError('Unable to load teacher messages.');
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadTeacherMessages().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (
      selectedChildId !== 'ALL' &&
      !childSnapshots.some((snapshot) => snapshot.student.id === selectedChildId)
    ) {
      setSelectedChildId('ALL');
    }
  }, [childSnapshots, selectedChildId]);

  const selectedChildLabel =
    selectedChildId === 'ALL'
      ? 'All children'
      : childSnapshots.find((snapshot) => snapshot.student.id === selectedChildId)?.student
          .fullName ?? 'All children';

  const visibleSnapshots = useMemo(() => {
    if (selectedChildId === 'ALL') {
      return childSnapshots;
    }

    return childSnapshots.filter((snapshot) => snapshot.student.id === selectedChildId);
  }, [childSnapshots, selectedChildId]);

  const averageConcentration =
    visibleSnapshots.length > 0
      ? Math.round(
          visibleSnapshots.reduce((sum, snapshot) => sum + snapshot.concentrationScore, 0) /
            visibleSnapshots.length,
        )
      : 0;

  const averageAttention =
    visibleSnapshots.length > 0
      ? Math.round(
          visibleSnapshots.reduce((sum, snapshot) => sum + snapshot.attentionScore, 0) /
            visibleSnapshots.length,
        )
      : 0;

  const averageClassEngagement =
    visibleSnapshots.length > 0
      ? Math.round(
          visibleSnapshots.reduce((sum, snapshot) => sum + snapshot.classEngagementScore, 0) /
            visibleSnapshots.length,
        )
      : 0;

  const totalSessions = visibleSnapshots.reduce(
    (sum, snapshot) => sum + snapshot.sessionCount,
    0,
  );

  const needsSupportCount = visibleSnapshots.filter(
    (snapshot) => snapshot.concentrationScore < 50,
  ).length;

  const topFocusChild =
    visibleSnapshots.length > 0
      ? [...visibleSnapshots].sort(
          (a, b) => b.concentrationScore - a.concentrationScore,
        )[0]
      : null;

  const guidanceCards = useMemo(() => {
    if (visibleSnapshots.length === 0) {
      return [
        'Link a child account to receive personalized guidance and weekly recommendations.',
      ];
    }

    return visibleSnapshots
      .slice()
      .sort((a, b) => a.concentrationScore - b.concentrationScore)
      .slice(0, 3)
      .map((snapshot) => snapshot.guidance);
  }, [visibleSnapshots]);

  const handleReply = async (conversationId: string) => {
    const message = (messageDrafts[conversationId] ?? '').trim();
    if (!message) {
      return;
    }

    setSendingConversationId(conversationId);
    setMessagesError(null);

    try {
      const sent = await messagesApi.sendMessage(conversationId, message);
      setTeacherConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: sent,
                lastMessageAt: sent.createdAt,
              }
            : conversation,
        ),
      );
      setMessageDrafts((current) => ({
        ...current,
        [conversationId]: '',
      }));
      setJustSentConversationId(conversationId);
      window.setTimeout(() => {
        setJustSentConversationId((current) =>
          current === conversationId ? null : current,
        );
      }, 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setMessagesError(err.message);
      } else {
        setMessagesError('Unable to send your reply right now.');
      }
    } finally {
      setSendingConversationId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-semibold text-[#2C3E50]">
            Guardian Dashboard
          </h2>

          <div className="relative">
            <label className="sr-only" htmlFor="guardian-child-filter">
              Select child
            </label>
            <select
              id="guardian-child-filter"
              value={selectedChildId}
              onChange={(event) => setSelectedChildId(event.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300"
            >
              <option value="ALL">All children</option>
              {childSnapshots.map((snapshot) => (
                <option key={snapshot.student.id} value={snapshot.student.id}>
                  {snapshot.student.fullName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Scope {selectedChildLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">
            Children {formatBadgeCount(guardianStats.childCount, 999)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1.5 text-xs font-semibold text-[#15803D]">
            Unread Messages {formatBadgeCount(guardianStats.unreadMessages)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#334155]">
            Notifications {formatBadgeCount(guardianStats.unreadNotifications)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-1.5 text-xs font-semibold text-[#BE123C]">
            Alerts {formatBadgeCount(guardianStats.alertsCount)}
          </span>
        </div>
      </header>

      {childrenError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {childrenError}
        </div>
      ) : null}

      {messagesError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {messagesError}
        </div>
      ) : null}

      {isLoadingChildren ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          <Loader2 size={16} className="animate-spin" />
          Loading class concentration...
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Average Concentration</p>
          <p className="text-4xl font-semibold text-[#2C3E50] mb-1">{averageConcentration}%</p>
          <p className="text-sm text-gray-600">{concentrationLabel(averageConcentration)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Average Attention in Class</p>
          <p className="text-4xl font-semibold text-[#2C3E50] mb-1">{averageAttention}%</p>
          <p className="text-sm text-gray-600">{formatBadgeCount(totalSessions, 999)} sessions analyzed</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Class Engagement</p>
          <p className="text-4xl font-semibold text-[#2C3E50] mb-1">{averageClassEngagement}%</p>
          <p className="text-sm text-gray-600">Learno classroom session signal</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Top Focus Child</p>
          <p className="text-2xl font-semibold text-[#2C3E50] mb-1 truncate">
            {topFocusChild?.student.fullName ?? 'No data yet'}
          </p>
          <p className="text-sm text-gray-600">
            {topFocusChild
              ? `${topFocusChild.concentrationScore}% concentration • ${trendLabel(topFocusChild.trend)}`
              : 'Waiting for class sessions'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold text-[#2C3E50]">Class Concentration Overview</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Parent-friendly chart (from class sessions)
              </span>
            </div>

            {visibleSnapshots.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                No child data available yet. Link a child account to see class concentration trends.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#2C3E50]">Concentration Score by Child</p>
                  {visibleSnapshots.map((snapshot) => (
                    <div key={snapshot.student.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{snapshot.student.fullName}</span>
                        <span className="font-semibold text-[#2C3E50]">{snapshot.concentrationScore}%</span>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2.5 rounded-full ${concentrationColor(snapshot.concentrationScore)}`}
                          style={{ width: `${snapshot.concentrationScore}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {snapshot.sessionCount} sessions • progress {snapshot.averageProgress}%
                      </p>
                      <p className={`mt-1 text-xs font-semibold ${concentrationStatusColor(snapshot.concentrationScore)}`}>
                        {concentrationStatusText(snapshot.concentrationScore)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#2C3E50]">Attention &amp; Engagement in Class</p>
                  {visibleSnapshots.map((snapshot) => (
                    <div
                      key={`${snapshot.student.id}-attention`}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{snapshot.student.fullName}</span>
                        <span className={`text-xs font-semibold ${trendTextColor(snapshot.trend)}`}>
                          {trendLabel(snapshot.trend)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${conditionTone[snapshot.themeCondition] ?? conditionTone.DEFAULT}`}
                        >
                          {conditionLabelMap[snapshot.themeCondition] ?? conditionLabelMap.DEFAULT}
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                            <span>Attention</span>
                            <span>{snapshot.attentionScore}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-sky-100">
                            <div
                              className="h-2 rounded-full bg-sky-500"
                              style={{ width: `${snapshot.attentionScore}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                            <span>Class engagement</span>
                            <span>{snapshot.classEngagementScore}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-violet-100">
                            <div
                              className="h-2 rounded-full bg-violet-500"
                              style={{ width: `${snapshot.classEngagementScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">
              Teacher Messages
            </h3>

            {isLoadingMessages ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" />
                Loading messages...
              </div>
            ) : null}

            {!isLoadingMessages && teacherConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                No teacher messages yet. You can start a conversation from the Messages page.
                <Link
                  href="/guardian/messages"
                  className="ml-2 font-semibold text-[#2563EB] hover:underline"
                >
                  Open Messages
                </Link>
              </div>
            ) : null}

            {!isLoadingMessages ? (
              <div className="space-y-4">
                {teacherConversations.map((conversation) => {
                  const draft = messageDrafts[conversation.id] ?? '';
                  const sending = sendingConversationId === conversation.id;

                  return (
                    <article key={conversation.id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="text-gray-700 mb-3">
                        {conversation.lastMessage?.content ??
                          'No message content yet. Send the first reply to open this conversation.'}
                      </p>
                      <div className="flex flex-col gap-3">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-700">
                            {conversation.otherUser.fullName}
                          </span>
                          <span className="mx-2">-</span>
                          <span>{formatMessageDate(conversation.lastMessageAt)}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {QUICK_REPLIES.map((reply) => (
                            <button
                              key={`${conversation.id}-${reply}`}
                              type="button"
                              onClick={() =>
                                setMessageDrafts((current) => ({
                                  ...current,
                                  [conversation.id]: reply,
                                }))
                              }
                              className="rounded-full border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1 text-xs font-medium text-[#1D4ED8] hover:bg-[#DBEAFE]"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={draft}
                            onChange={(event) =>
                              setMessageDrafts((current) => ({
                                ...current,
                                [conversation.id]: event.target.value,
                              }))
                            }
                            placeholder="Write your reply to the teacher"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                          <button
                            type="button"
                            onClick={() => void handleReply(conversation.id)}
                            disabled={sending || !draft.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                            Reply
                          </button>
                        </div>

                        {justSentConversationId === conversation.id ? (
                          <p className="text-xs font-medium text-emerald-700">
                            Reply sent to {conversation.otherUser.fullName}.
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}

                <div className="text-right">
                  <Link
                    href="/guardian/messages"
                    className="text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    View full message center -&gt;
                  </Link>
                </div>
              </div>
            ) : null}
          </section>

        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">Guardian Guidance</h3>

            <div className="space-y-3">
              {guidanceCards.map((guidance) => (
                <div key={guidance} className="flex gap-3 p-4 bg-[#EBF4FF] rounded-lg border border-[#BFDBFE]">
                  <Info size={20} className="text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-sm">{guidance}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">Alerts</h3>

            <div className="space-y-3">
              <div className="flex gap-3 p-4 bg-[#FEF9C3] rounded-lg border border-[#FDE047]">
                <AlertCircle
                  size={20}
                  className="text-[#CA8A04] flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-gray-700">
                  {needsSupportCount > 0
                    ? `${needsSupportCount} child account(s) need extra attention this week.`
                    : 'No critical concentration alerts right now. Keep your current routine.'}
                </p>
              </div>

              <div className="flex gap-3 p-4 bg-[#DCFCE7] rounded-lg border border-[#86EFAC]">
                <Info size={20} className="text-[#16A34A] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  A 15-minute daily parent check-in can improve consistency and confidence.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#EBF4FF] to-white rounded-xl p-6 shadow-sm border border-[#BFDBFE]">
            <div className="flex items-start gap-3 mb-3">
              <Shield size={24} className="text-[#2563EB] flex-shrink-0" />
              <h3 className="text-lg font-semibold text-[#2C3E50]">
                Privacy Protected
              </h3>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              No video data is stored. Only learning behavior patterns are used to support family follow-up.
            </p>

            <button className="mt-4 text-sm text-[#2563EB] hover:underline font-medium">
              Learn more about our privacy practices -&gt;
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
