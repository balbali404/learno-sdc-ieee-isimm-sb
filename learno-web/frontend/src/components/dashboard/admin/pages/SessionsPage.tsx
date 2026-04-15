'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Play, Square, FileText, AlertTriangle, BrainCircuit, X } from 'lucide-react';
import { adminApi, type AdminSessionAnalysis, type AdminSessionDetail } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/http';
import type { SessionHistoryItem, SessionStatus } from '@/lib/api/types';

type TeacherOption = { id: string; name: string; email: string };

const statusOptions: Array<{ value: '' | SessionStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'RECORDING', label: 'Recording' },
  { value: 'WAITING_UPLOAD', label: 'Waiting Upload' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING', label: 'Pending' },
];

const toneByStatus: Record<string, string> = {
  RECORDING: 'border-red-100 bg-red-50 text-red-700',
  WAITING_UPLOAD: 'border-amber-100 bg-amber-50 text-amber-700',
  PROCESSING: 'border-blue-100 bg-blue-50 text-blue-700',
  COMPLETED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  FAILED: 'border-rose-100 bg-rose-50 text-rose-700',
  PENDING: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function SessionsPage() {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | SessionStatus>('');

  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    recording: 0,
    processing: 0,
    waitingUpload: 0,
    completed: 0,
    failed: 0,
    withPdf: 0,
    averageEngagement: 0,
  });

  const [startTeacherId, setStartTeacherId] = useState('');
  const [stopSessionId, setStopSessionId] = useState('');
  const [analysisSessionId, setAnalysisSessionId] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AdminSessionAnalysis | null>(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<AdminSessionDetail | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [analysisWarning, setAnalysisWarning] = useState<string | null>(null);

  const toVisionPercent = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '—';
    }
    const normalized = value <= 1 ? value * 100 : value;
    const rounded = Math.max(0, Math.min(100, Math.round(normalized)));
    return `${rounded}%`;
  };

  const openPdfBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const liveSessions = useMemo(
    () => sessions.filter((session) => session.status === 'RECORDING'),
    [sessions],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [teachersResponse, sessionsResponse] = await Promise.all([
        adminApi.getTeachers(),
        adminApi.getSessions({
          teacherId: selectedTeacherId || undefined,
          status: statusFilter || undefined,
          limit: 100,
        }),
      ]);

      setTeachers(
        teachersResponse.teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
        })),
      );

      setSessions(sessionsResponse.sessions);
      setSummary(sessionsResponse.summary);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load session data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeacherId, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStartSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startTeacherId) {
      return;
    }

    setIsActing(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await adminApi.startSession({ teacherId: startTeacherId, autoStart: true });
      const fastApiNote = response.fastApiForwarded ? '' : ` (${response.warning ?? 'FastAPI not reachable'})`;
      setActionMessage(`Session started successfully${fastApiNote}.`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to start session.');
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleStopSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stopSessionId) {
      return;
    }

    setIsActing(true);
    setError(null);
    setActionMessage(null);

    try {
      const response = await adminApi.stopSession({ sessionId: stopSessionId, reason: 'admin_stop' });
      const fastApiNote = response.fastApiForwarded ? '' : ` (${response.warning ?? 'FastAPI not reachable'})`;
      setActionMessage(`Session stopped successfully${fastApiNote}.`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to stop session.');
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleAnalyzeSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!analysisSessionId) {
      return;
    }

    setIsActing(true);
    setError(null);
    setActionMessage(null);
    setAnalysisWarning(null);

    try {
      const response = await adminApi.analyzeSession(analysisSessionId);
      setAnalysisResult(response.analysis);
      if (response.warning) {
        setAnalysisWarning(response.warning);
      }
      setActionMessage('Analysis completed successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to analyze session.');
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleOpenSessionDetail = async (sessionId: string) => {
    setIsDetailLoading(true);
    setError(null);
    setSelectedSessionId(sessionId);

    try {
      const detail = await adminApi.getSessionDetail(sessionId);
      setSelectedSessionDetail(detail);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to load session detail.');
      }
      setSelectedSessionDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseSessionDetail = () => {
    setSelectedSessionDetail(null);
    setSelectedSessionId(null);
  };

  const handleOpenLessonPdf = async (sessionId: string) => {
    setError(null);
    try {
      const blob = await adminApi.getSessionLessonPdf(sessionId);
      openPdfBlob(blob);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to open lesson PDF.');
      }
    }
  };

  const handleOpenAdvicePdf = async (sessionId: string) => {
    setError(null);
    try {
      const blob = await adminApi.getSessionAdvicePdf(sessionId);
      openPdfBlob(blob);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to open advice PDF.');
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Sessions" value={String(summary.total)} icon={<Activity size={15} />} />
        <StatCard label="Live" value={String(summary.recording)} icon={<Play size={15} />} tone="red" />
        <StatCard label="Completed" value={String(summary.completed)} icon={<FileText size={15} />} tone="green" />
        <StatCard
          label="With PDFs"
          value={String(summary.withPdf)}
          icon={<FileText size={15} />}
          subtitle={`Avg engagement ${Math.round(summary.averageEngagement)}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <form
          onSubmit={handleStartSession}
          className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-1"
        >
          <p className="text-sm font-semibold text-slate-800">Start Session</p>
          <p className="mt-1 text-xs text-slate-500">Start a session on behalf of a teacher.</p>
          <select
            value={startTeacherId}
            onChange={(event) => setStartTeacherId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isActing}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Play size={14} /> Start
          </button>
        </form>

        <form
          onSubmit={handleStopSession}
          className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-1"
        >
          <p className="text-sm font-semibold text-slate-800">Stop Session</p>
          <p className="mt-1 text-xs text-slate-500">Stop any active session by ID.</p>
          <select
            value={stopSessionId}
            onChange={(event) => setStopSessionId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select active session</option>
            {liveSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.id.slice(0, 8)} - {session.teacher.fullName}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isActing}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Square size={14} /> Stop
          </button>
        </form>

        <form
          onSubmit={handleAnalyzeSession}
          className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-1"
        >
          <p className="text-sm font-semibold text-slate-800">Analyze Session</p>
          <p className="mt-1 text-xs text-slate-500">
            Run AI analysis from FastAPI for a completed session.
          </p>
          <select
            value={analysisSessionId}
            onChange={(event) => setAnalysisSessionId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select completed session</option>
            {sessions
              .filter((session) => session.status === 'COMPLETED')
              .map((session) => (
                <option key={session.id} value={session.id}>
                  {session.id.slice(0, 8)} - {session.teacher.fullName}
                </option>
              ))}
          </select>

          <button
            type="submit"
            disabled={isActing}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <BrainCircuit size={14} /> Analyze
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-1">
          <p className="text-sm font-semibold text-slate-800">History Filters</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <select
              value={selectedTeacherId}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as '' | SessionStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {analysisWarning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {analysisWarning}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {analysisResult ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">AI Session Analysis</p>
              <p className="text-xs text-slate-500">
                Session #{analysisResult.sessionId?.slice(0, 8)}
              </p>
            </div>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              AI
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Engagement</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">
                {analysisResult.engagementScore ?? 0}/100
              </p>
              <p className="text-xs text-slate-500">{analysisResult.engagementBand ?? 'unknown'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Stress</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">
                {analysisResult.stressScore ?? 0}/100
              </p>
              <p className="text-xs text-slate-500">{analysisResult.stressBand ?? 'unknown'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Summary</p>
              <p className="mt-1 text-sm text-slate-700">
                {analysisResult.summary ?? 'No summary available.'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {analysisResult.stressSummary ?? ''}
              </p>
            </div>
          </div>

          {analysisResult.alerts && analysisResult.alerts.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alerts</p>
              {analysisResult.alerts.map((alert, index) => (
                <div
                  key={`${alert.type}-${index}`}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="font-semibold">{alert.type}</span> · {alert.message}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedSessionDetail || isDetailLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Session Detail</p>
              <p className="text-xs text-slate-500">
                {selectedSessionId ? `Session #${selectedSessionId}` : 'Loading...'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseSessionDetail}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X size={12} /> Close
            </button>
          </div>

          {isDetailLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading session detail...</p>
          ) : selectedSessionDetail ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Teacher</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedSessionDetail.teacher.fullName}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedSessionDetail.class?.name ?? 'No class'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Engagement</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {typeof selectedSessionDetail.engagementScore === 'number'
                      ? `${Math.round(selectedSessionDetail.engagementScore)}%`
                      : 'Not available'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Vision Avg</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {toVisionPercent(selectedSessionDetail.classEngagementAvg)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Vision Min</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {toVisionPercent(selectedSessionDetail.classEngagementMin)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Vision Max</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {toVisionPercent(selectedSessionDetail.classEngagementMax)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Low Engagement</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedSessionDetail.lowEngagementCount ?? 0}/{selectedSessionDetail.classStudentCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Frames</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedSessionDetail.totalFramesAnalyzed ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {selectedSessionDetail.lessonPdfPath ? (
                  <button
                    type="button"
                    onClick={() => handleOpenLessonPdf(selectedSessionDetail.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50 px-2 py-1 font-semibold text-sky-700"
                  >
                    Lesson PDF
                  </button>
                ) : null}
                {selectedSessionDetail.advicePdfPath ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAdvicePdf(selectedSessionDetail.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                  >
                    Advice PDF
                  </button>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Vision Students</p>
                {!selectedSessionDetail.visionStudents || selectedSessionDetail.visionStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">No per-student vision records for this session.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full min-w-[720px] text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
                          <th className="px-3 py-2">Seat</th>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2">Avg</th>
                          <th className="px-3 py-2">Min</th>
                          <th className="px-3 py-2">Max</th>
                          <th className="px-3 py-2">Trend</th>
                          <th className="px-3 py-2">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {selectedSessionDetail.visionStudents.map((row) => (
                          <tr key={row.id}>
                            <td className="px-3 py-2">{row.seatNumber ?? row.seatNumberFromStudent ?? '—'}</td>
                            <td className="px-3 py-2">{row.studentName ?? row.detectedStudentId ?? 'Unknown'}</td>
                            <td className="px-3 py-2">{toVisionPercent(row.meanCaes)}</td>
                            <td className="px-3 py-2">{toVisionPercent(row.minCaes)}</td>
                            <td className="px-3 py-2">{toVisionPercent(row.maxCaes)}</td>
                            <td className="px-3 py-2">{row.trend ?? '—'}</td>
                            <td className="px-3 py-2">
                              {row.lowEngagement ? (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">Low</span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Normal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedSessionDetail.alerts && selectedSessionDetail.alerts.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Session Alerts</p>
                  <div className="space-y-2">
                    {selectedSessionDetail.alerts.slice(0, 6).map((alert) => (
                      <div key={alert.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-semibold">{alert.type}</span> - {alert.message}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Session History</p>
        </div>

        <div className="max-h-[28rem] overflow-auto">
          {isLoading ? <p className="px-4 py-4 text-sm text-slate-500">Loading sessions...</p> : null}

          {!isLoading && sessions.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">No sessions found for this filter.</p>
          ) : null}

          {!isLoading
            ? sessions.map((session) => (
                <div
                  key={session.id}
                  className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{session.teacher.fullName}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        toneByStatus[session.status] ?? toneByStatus.PENDING
                      }`}
                    >
                      {session.status}
                    </span>
                    {session._count?.alerts ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle size={12} /> {session._count.alerts} alerts
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Session #{session.id} · {session.class?.name ?? 'No class'} · {session.subject?.name ?? 'No subject'}
                  </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenSessionDetail(session.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 font-semibold text-indigo-700"
                      >
                        Details
                      </button>

                      {session.lessonPdfPath ? (
                        <button
                          type="button"
                        onClick={() => handleOpenLessonPdf(session.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50 px-2 py-1 font-semibold text-sky-700"
                      >
                        Lesson PDF
                      </button>
                    ) : null}

                    {session.advicePdfPath ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAdvicePdf(session.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700"
                      >
                        Advice PDF
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
  tone = 'blue',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  tone?: 'blue' | 'red' | 'green';
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-100 bg-red-50 text-red-700'
      : tone === 'green'
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
        : 'border-sky-100 bg-sky-50 text-sky-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex rounded-lg border px-2 py-1 ${toneClass}`}>{icon}</div>
      <p className="mt-2 text-xl font-bold text-slate-800">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
