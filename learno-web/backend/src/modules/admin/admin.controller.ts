import { Request, Response } from "express";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import prisma from "../../config/prisma.js";
import { refreshEnvironmentIngest } from "../../core/jobs/environmentIngest.js";
import { calculateAge } from "../../utils/calculateAge.js";
import type { AdminStartSessionInput, AdminStopSessionInput } from "./admin.validators.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const SENSOR_API_URL = process.env.SENSOR_API_URL || "http://127.0.0.1:3000/api/latest";
const prismaAny = prisma as any;

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const toDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const percentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const formatAlertType = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const formatDateLabel = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatRelativeTime = (date: Date, now = new Date()): string => {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) {
    return "Just now";
  }

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks}w ago`;
};

const buildInitials = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NA";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildDemoEnvironmentSample = (
  seedKey: string,
  referenceDate: Date,
): { co2: number; light: number; noise: number; updatedAt: string } => {
  const seed = hashString(seedKey);
  const minuteWave = Math.sin(referenceDate.getTime() / 180000 + (seed % 31));
  const secondWave = Math.cos(referenceDate.getTime() / 19000 + (seed % 17));

  const co2Base = 400 + (seed % 100);
  const lightBase = 52 + (seed % 14) - 7;
  const noiseBase = 44 + (seed % 10);

  return {
    co2: clamp(Math.round(co2Base + minuteWave * 80 + secondWave * 20), 380, 1200),
    light: clamp(Math.round(lightBase + minuteWave * 13 + secondWave * 4), 18, 94),
    noise: clamp(Math.round(noiseBase + minuteWave * 7 + secondWave * 2), 34, 75),
    updatedAt: referenceDate.toISOString(),
  };
};

const avatarPalette = [
  { bg: "#EEF0FD", color: "#6366F1" },
  { bg: "#F0FDF9", color: "#14B8A6" },
  { bg: "#FFFBEB", color: "#F59E0B" },
  { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#E1F5FE", color: "#0284C7" },
  { bg: "#FEF2F2", color: "#EF4444" },
];

const pickAvatarTone = (seed: string) => {
  const index = hashString(seed) % avatarPalette.length;
  return avatarPalette[index];
};

const dayEnumByIndex = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const resolveSchoolId = (req: Request, res: Response): string | null => {
  const requestedSchoolId = typeof req.query.schoolId === "string" ? req.query.schoolId : undefined;
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
  const schoolId = isSuperAdmin
    ? requestedSchoolId ?? req.user?.schoolId
    : req.user?.schoolId;

  if (!schoolId) {
    res.status(400).json({ message: "School ID is required." });
    return null;
  }

  if (!isSuperAdmin && requestedSchoolId && requestedSchoolId !== schoolId) {
    res.status(403).json({ message: "Forbidden. Cross-school access denied." });
    return null;
  }

  return schoolId;
};

const normalizeScore = (value: number | null | undefined): number => {
  return clamp(Math.round(value ?? 0), 0, 100);
};

const toAsciiFileName = (input: string, fallback: string): string => {
  const normalized = input
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");

  return normalized || fallback;
};

const servePdfFromStoredPath = async (
  res: Response,
  pdfPath: string,
  fallbackFileName: string,
): Promise<boolean> => {
  let pdfAbsPath = pdfPath;
  if (!path.isAbsolute(pdfAbsPath)) {
    pdfAbsPath = path.resolve(pdfAbsPath);
  }

  const fileName = path.basename(pdfAbsPath);
  const safeFileName = toAsciiFileName(fileName, fallbackFileName);

  if (fs.existsSync(pdfAbsPath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
    fs.createReadStream(pdfAbsPath).pipe(res);
    return true;
  }

  const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
  const candidates = [
    `${fastApiUrl}/files/${encodeURIComponent(pdfAbsPath)}`,
    `${fastApiUrl}/files/${encodeURIComponent(fileName)}`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
      res.send(Buffer.from(arrayBuffer));
      return true;
    } catch (error) {
      console.warn("FastAPI PDF fetch failed:", error);
    }
  }

  return false;
};

type SensorTelemetryPayload = {
  receivedAt?: string;
  metrics?: {
    lightLux?: number | null;
    mq7LevelPct?: number | null;
    co2Ppm?: number | null;
    temperatureC?: number | null;
    humidityPct?: number | null;
  };
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 2000 }, (res) => {
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        resolve(null);
        return;
      }

      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
};

const buildEnvironmentSnapshot = (telemetry?: SensorTelemetryPayload | null) => {
  if (!telemetry) {
    return undefined;
  }

  const lightLux = telemetry.metrics?.lightLux ?? null;
  const mq7LevelPct = telemetry.metrics?.mq7LevelPct ?? null;
  const directCo2Ppm = telemetry.metrics?.co2Ppm ?? null;

  let lightPct = 0;
  if (lightLux != null) {
    lightPct =
      lightLux <= 100
        ? clamp(Math.round(lightLux), 0, 100)
        : clamp(Math.round((lightLux / 800) * 100), 0, 100);
  }
  const computedCo2 =
    mq7LevelPct == null
      ? null
      : clamp(Math.round(400 + (mq7LevelPct / 100) * 1600), 400, 2000);
  const co2PpmRaw = directCo2Ppm ?? computedCo2;
  const co2Ppm = co2PpmRaw == null ? 0 : clamp(Math.round(co2PpmRaw), 400, 2000);

  return {
    noise: 0,
    co2: co2Ppm,
    light: lightPct,
    updatedAt: telemetry.receivedAt ?? new Date().toISOString(),
  };
};

const buildEnvironmentTrend = (snapshot?: { noise: number; co2: number; light: number } | null) => {
  if (!snapshot) {
    return [];
  }

  return [
    {
      time: "Now",
      noise: snapshot.noise,
      co2: snapshot.co2,
      light: snapshot.light,
    },
  ];
};

const classifyEnvironmentAlertPriority = (metric: "co2" | "light" | "noise", value: number): "high" | "medium" | "low" => {
  if (metric === "co2") {
    if (value >= 1200) return "high";
    if (value >= 900) return "medium";
    return "low";
  }

  if (metric === "light") {
    if (value <= 20 || value >= 90) return "high";
    if (value <= 30 || value >= 75) return "medium";
    return "low";
  }

  if (value >= 75) return "high";
  if (value >= 60) return "medium";
  return "low";
};

const buildEnvironmentAlertTitle = (metric: "co2" | "light" | "noise", value: number): string => {
  if (metric === "co2") {
    return value >= 1200 ? "High CO2" : value >= 900 ? "Elevated CO2" : "CO2 Stable";
  }
  if (metric === "light") {
    if (value <= 20) return "Low Light";
    if (value >= 90) return "Excessive Light";
    return value <= 30 || value >= 75 ? "Light Imbalance" : "Light Stable";
  }
  return value >= 75 ? "High Noise" : value >= 60 ? "Rising Noise" : "Noise Stable";
};

const buildEnvironmentAlertDescription = (metric: "co2" | "light" | "noise", value: number): string => {
  if (metric === "co2") {
    return `Current CO2 is ${value} ppm.`;
  }
  if (metric === "light") {
    return `Current light level is ${value}%.`;
  }
  return `Current noise level is ${value} dB.`;
};

const estimateAttendance = (engagement: number, attention: number): number => {
  return clamp(Math.round((engagement + attention) / 2 + 8), 0, 100);
};

const deriveStudentStatus = (engagement: number, attention: number) => {
  const score = Math.round((engagement + attention) / 2);
  if (score < 45) {
    return {
      status: "flagged" as const,
      flag: engagement <= attention ? "Low engagement" : "Low attention",
      score,
    };
  }

  if (score < 60) {
    return {
      status: "risk" as const,
      flag: engagement <= attention ? "Attention drop" : "Engagement dip",
      score,
    };
  }

  return { status: "active" as const, flag: null, score };
};

const toRating = (engagement: number | null | undefined): number => {
  const base = clamp(engagement ?? 75, 0, 100);
  const rating = 3.2 + (base / 100) * 1.8;
  return clamp(Math.round(rating * 10) / 10, 3, 5);
};

const formatShortDate = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
};

const formatMonthLabel = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
};

const toBand = (score: number): string => {
  if (score >= 80) return "HIGH";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "LOW";
  return "VERY_LOW";
};

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const now = new Date();
    const startToday = startOfDay(now);
    const startWeek = new Date(now.getTime() - 7 * MS_PER_DAY);
    const startPrevWeek = new Date(now.getTime() - 14 * MS_PER_DAY);
    const startMonth = new Date(now.getTime() - 30 * MS_PER_DAY);
    const startPrevMonth = new Date(now.getTime() - 60 * MS_PER_DAY);
    const startAlertWindow = new Date(now.getTime() - MS_PER_DAY);
    const startPrevAlertWindow = new Date(now.getTime() - 2 * MS_PER_DAY);

    const [
      adminUser,
      school,
      studentCount,
      classCount,
      studentAverages,
      studentRows,
      sessionsLast14Days,
      openAlertsCount,
      alertsTodayCount,
      alertsLast24h,
      alertsPrev24h,
      recentAlerts,
      teachers,
      classesCreatedCurrent,
      classesCreatedPrevious,
      studentsCreatedCurrent,
      studentsCreatedPrevious,
classStudentCounts,
      latestTeacherSessions,
      sensorTelemetry,
      liveSessions,
      latestReadingByClass,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { fullName: true, school: { select: { name: true } } },
      }),
      prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
      prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
      prisma.class.count({ where: { schoolId } }),
      prisma.studentXP.aggregate({
        where: { student: { schoolId } },
        _avg: { averageEngagement: true, averageConcentration: true },
      }),
      prisma.user.findMany({
        where: { schoolId, role: "STUDENT" },
        select: {
          id: true,
          fullName: true,
          enrollment: { select: { class: { select: { name: true } } } },
          studentXP: { select: { averageEngagement: true, averageConcentration: true } },
        },
        take: 200,
      }),
      prisma.session.findMany({
        where: {
          teacher: { schoolId },
          createdAt: { gte: startPrevWeek },
        },
        select: {
          teacherId: true,
          classId: true,
          engagementScore: true,
          createdAt: true,
          class: { select: { id: true, name: true } },
        },
      }),
      prisma.sessionAlert.count({
        where: { session: { teacher: { schoolId } }, acknowledgedAt: null },
      }),
      prisma.sessionAlert.count({
        where: { session: { teacher: { schoolId } }, createdAt: { gte: startToday } },
      }),
      prisma.sessionAlert.count({
        where: { session: { teacher: { schoolId } }, createdAt: { gte: startAlertWindow } },
      }),
      prisma.sessionAlert.count({
        where: {
          session: { teacher: { schoolId } },
          createdAt: { gte: startPrevAlertWindow, lt: startAlertWindow },
        },
      }),
      prisma.sessionAlert.findMany({
        where: { session: { teacher: { schoolId } } },
        include: {
          session: { select: { class: { select: { name: true } }, subject: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.user.findMany({
        where: { schoolId, role: "TEACHER" },
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          profile: { select: { phone: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.class.count({ where: { schoolId, createdAt: { gte: startMonth } } }),
      prisma.class.count({
        where: { schoolId, createdAt: { gte: startPrevMonth, lt: startMonth } },
      }),
      prisma.user.count({
        where: { schoolId, role: "STUDENT", createdAt: { gte: startMonth } },
      }),
      prisma.user.count({
        where: { schoolId, role: "STUDENT", createdAt: { gte: startPrevMonth, lt: startMonth } },
      }),
      prisma.studentClass.groupBy({
        by: ["classId"],
        where: { class: { schoolId } },
        _count: { _all: true },
      }),
      prisma.session.groupBy({
        by: ["teacherId"],
        where: { teacher: { schoolId } },
        _max: { createdAt: true },
      }),
      (async () => {
        try {
          return await fetchJson<{ telemetry?: SensorTelemetryPayload }>(SENSOR_API_URL);
        } catch {
          return null;
        }
      })(),
      prisma.session.findMany({
        where: {
          teacher: { schoolId },
          status: {
            in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING"],
          },
        },
        select: {
          id: true,
          teacherId: true,
          classId: true,
          status: true,
          actualStart: true,
          createdAt: true,
          class: { select: { id: true, name: true } },
          teacher: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prismaAny.environmentReading.findMany({
        where: {
          class: { schoolId },
        },
        select: {
          classId: true,
          co2Ppm: true,
          lightLux: true,
          receivedAt: true,
          class: { select: { id: true, name: true } },
        },
        orderBy: { receivedAt: "desc" },
        take: 300,
      }),
    ]);

    const avgEngagement = Math.round(studentAverages._avg.averageEngagement ?? 0);
    const avgAttention = Math.round(studentAverages._avg.averageConcentration ?? 0);

    const activeTeacherSet = new Set(
      sessionsLast14Days
        .filter((session) => session.createdAt >= startWeek)
        .map((session) => session.teacherId),
    );
    const previousTeacherSet = new Set(
      sessionsLast14Days
        .filter((session) => session.createdAt < startWeek)
        .map((session) => session.teacherId),
    );

    const teachersActive = activeTeacherSet.size;
    const teachersTrend = percentChange(teachersActive, previousTeacherSet.size);

    const totalStudentsTrend = percentChange(studentsCreatedCurrent, studentsCreatedPrevious);
    const activeClassesTrend = classesCreatedCurrent - classesCreatedPrevious;
    const alertsTrend = alertsLast24h - alertsPrev24h;

    const greetingName = adminUser?.fullName ?? "Administrator";
    const schoolName = school?.name ?? adminUser?.school?.name ?? "School";

    const trendDays = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now.getTime() - (6 - index) * MS_PER_DAY);
      return {
        date,
        key: toDateKey(date),
        label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      };
    });

    const scoresByDay = new Map<string, number[]>();
    sessionsLast14Days.forEach((session) => {
      if (session.engagementScore === null || session.engagementScore === undefined) {
        return;
      }
      const key = toDateKey(session.createdAt);
      const current = scoresByDay.get(key) ?? [];
      current.push(session.engagementScore);
      scoresByDay.set(key, current);
    });

    const engagementTrend = trendDays.map((day) => {
      const dayScores = scoresByDay.get(day.key) ?? [];
      const engagement = dayScores.length ? average(dayScores) : avgEngagement;
      const attention = clamp(Math.round(engagement * 0.88 + 8), 0, 100);
      const attendance = clamp(Math.round(engagement * 0.92 + 6), 0, 100);
      return {
        day: day.label,
        engagement,
        attention,
        attendance,
      };
    });

    const classScores = new Map<string, { name: string; scores: number[] }>();
    sessionsLast14Days.forEach((session) => {
      if (!session.class || session.engagementScore === null || session.engagementScore === undefined) {
        return;
      }
      if (session.createdAt < startWeek) {
        return;
      }
      const entry = classScores.get(session.class.id) ?? {
        name: session.class.name,
        scores: [],
      };
      entry.scores.push(session.engagementScore);
      classScores.set(session.class.id, entry);
    });

    const attentionByClass = Array.from(classScores.values())
      .map((entry) => ({
        class: entry.name,
        score: clamp(Math.round(average(entry.scores) * 0.9 + 5), 0, 100),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const alertItems = recentAlerts.map((alert) => {
      const typeLabel = formatAlertType(alert.alertType);
      const priority =
        alert.severity === "CRITICAL"
          ? "high"
          : alert.severity === "WARNING"
            ? "medium"
            : "low";
      const roomLabel = alert.session?.class?.name ?? alert.session?.subject?.name ?? "General";
      return {
        id: alert.id,
        title: typeLabel,
        desc: alert.message ?? "Alert raised during session.",
        type: typeLabel,
        room: roomLabel,
        time: formatTime(alert.createdAt),
        priority,
        status: alert.acknowledgedAt || alert.isRead ? "resolved" : "open",
      };
    });

    const classStudentCountMap = new Map<string, number>();
    classStudentCounts.forEach((row) => {
      classStudentCountMap.set(row.classId, row._count._all);
    });

    const latestTeacherSessionMap = new Map<string, Date>();
    latestTeacherSessions.forEach((row) => {
      if (row._max.createdAt) {
        latestTeacherSessionMap.set(row.teacherId, row._max.createdAt);
      }
    });

    const teacherIds = teachers.map((teacher) => teacher.id);
    const timetables = teacherIds.length
      ? await prisma.timetable.findMany({
          where: { teacherId: { in: teacherIds } },
          select: {
            teacherId: true,
            classId: true,
            subject: { select: { name: true } },
            class: { select: { id: true, name: true } },
          },
        })
      : [];

    const classesByTeacher = new Map<string, Set<string>>();
    const subjectsByTeacher = new Map<string, Map<string, number>>();

    timetables.forEach((entry) => {
      const classSet = classesByTeacher.get(entry.teacherId) ?? new Set<string>();
      if (entry.classId) {
        classSet.add(entry.classId);
      }
      classesByTeacher.set(entry.teacherId, classSet);

      if (entry.subject?.name) {
        const subjectMap = subjectsByTeacher.get(entry.teacherId) ?? new Map<string, number>();
        subjectMap.set(entry.subject.name, (subjectMap.get(entry.subject.name) ?? 0) + 1);
        subjectsByTeacher.set(entry.teacherId, subjectMap);
      }
    });

    const teacherCards = teachers.map((teacher) => {
      const latestSession = latestTeacherSessionMap.get(teacher.id);
      const lastActivity = latestSession ? formatRelativeTime(latestSession, now) : "No recent activity";
      const diffDays = latestSession ? Math.floor((now.getTime() - latestSession.getTime()) / MS_PER_DAY) : null;
      const status = diffDays === null ? "inactive" : diffDays <= 1 ? "active" : diffDays <= 7 ? "away" : "inactive";

      const subjectMap = subjectsByTeacher.get(teacher.id);
      let primarySubject = "General";
      if (subjectMap && subjectMap.size > 0) {
        const sorted = Array.from(subjectMap.entries()).sort((a, b) => b[1] - a[1]);
        primarySubject = sorted[0][0];
      }

      const classIds = classesByTeacher.get(teacher.id) ?? new Set<string>();
      const studentsTotal = Array.from(classIds).reduce(
        (sum, classId) => sum + (classStudentCountMap.get(classId) ?? 0),
        0,
      );

      const experienceYears = Math.floor((now.getTime() - teacher.createdAt.getTime()) / (365 * MS_PER_DAY));
      const experience = experienceYears > 0 ? `${experienceYears} yrs` : "New";
      const initials = buildInitials(teacher.fullName);
      const tone = pickAvatarTone(teacher.id);

      return {
        id: teacher.id,
        name: teacher.fullName,
        subject: primarySubject,
        classes: classIds.size,
        students: studentsTotal,
        rating: 4.6,
        status,
        email: teacher.email,
        phone: teacher.profile?.phone ?? null,
        avatar: initials,
        avatarBg: tone.bg,
        avatarColor: tone.color,
        experience,
        lastActivity,
      };
    });

    const needsAttention = studentRows
      .map((student) => {
        const engagement = student.studentXP?.averageEngagement ?? 0;
        const attention = student.studentXP?.averageConcentration ?? 0;
        const score = Math.round((engagement + attention) / 2);
        const flag =
          engagement <= attention
            ? "Low engagement"
            : "Low attention";
        const initials = buildInitials(student.fullName);
        const tone = pickAvatarTone(student.id);
        return {
          id: student.id,
          name: student.fullName,
          class: student.enrollment?.class?.name ?? "--",
          flag,
          score,
          avatar: initials,
          avatarBg: tone.bg,
          avatarColor: tone.color,
        };
      })
      .filter((student) => student.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(({ id, name, class: className, flag, avatar, avatarBg, avatarColor }) => ({
        id,
        name,
        class: className,
        flag,
        avatar,
        avatarBg,
        avatarColor,
      }));

    const behavioralPatterns = [
      { label: "Avg Engagement", value: `${avgEngagement}%`, icon: "UP" },
      { label: "Avg Attention", value: `${avgAttention}%`, icon: "ATTN" },
      {
        label: "Sessions This Week",
        value: `${sessionsLast14Days.filter((session) => session.createdAt >= startWeek).length}`,
        icon: "SESS",
      },
    ];

    const demoDataAllClasses = buildDemoEnvironmentSample("all-classes-avg", now);

    const latestReadingMap = new Map<string, any>();
    for (const reading of latestReadingByClass) {
      if (!reading.classId || latestReadingMap.has(reading.classId)) {
        continue;
      }
      latestReadingMap.set(reading.classId, reading);
    }

    const liveSessionEnvironment = liveSessions.map((session) => {
      const reading = session.classId ? latestReadingMap.get(session.classId) : null;
      const demoSample = buildDemoEnvironmentSample(
        `${session.id}:${session.classId ?? "no-class"}`,
        now,
      );
      const co2 =
        typeof reading?.co2Ppm === "number"
          ? clamp(Math.round(reading.co2Ppm), 400, 2200)
          : demoSample.co2;
      const light =
        typeof reading?.lightLux === "number"
          ? clamp(
              Math.round(reading.lightLux <= 100 ? reading.lightLux : (reading.lightLux / 800) * 100),
              0,
              100,
            )
          : demoSample.light;
      const noise = demoSample.noise;

      return {
        sessionId: session.id,
        classId: session.class?.id ?? session.classId ?? null,
        className: session.class?.name ?? "Unknown class",
        teacherId: session.teacher?.id ?? session.teacherId,
        teacherName: session.teacher?.fullName ?? "Unknown teacher",
        status: session.status,
        startedAt: (session.actualStart ?? session.createdAt).toISOString(),
        co2,
        light,
        noise,
        updatedAt: reading?.receivedAt ? new Date(reading.receivedAt).toISOString() : demoSample.updatedAt,
      };
});

    const avgLiveCo2 = liveSessionEnvironment.length
      ? Math.round(liveSessionEnvironment.reduce((sum, item) => sum + item.co2, 0) / liveSessionEnvironment.length)
      : Math.round(demoDataAllClasses.co2);
    const avgLiveLight = liveSessionEnvironment.length
      ? Math.round(liveSessionEnvironment.reduce((sum, item) => sum + item.light, 0) / liveSessionEnvironment.length)
      : Math.round(demoDataAllClasses.light);
    const avgLiveNoise = liveSessionEnvironment.length
      ? Math.round(liveSessionEnvironment.reduce((sum, item) => sum + item.noise, 0) / liveSessionEnvironment.length)
      : Math.round(demoDataAllClasses.noise);

    // Create alerts from live session environment data
    const liveEnvironmentAlerts = liveSessionEnvironment.flatMap((item) => {
      const candidates: Array<{ metric: "co2" | "light" | "noise"; value: number }> = [
        { metric: "co2", value: item.co2 },
        { metric: "light", value: item.light },
        { metric: "noise", value: item.noise },
      ];

      return candidates
        .map((entry) => {
          const priority = classifyEnvironmentAlertPriority(entry.metric, entry.value);
          if (priority === "low") {
            return null;
          }
          const unit = entry.metric === "co2" ? "ppm" : entry.metric === "noise" ? "dB" : "%";
          return {
            id: `env-${item.sessionId}-${item.classId}-${entry.metric}`,
            title: buildEnvironmentAlertTitle(entry.metric, entry.value),
            desc: `${buildEnvironmentAlertDescription(entry.metric, entry.value)} (${item.className})`,
            type: entry.metric.toUpperCase(),
            room: item.className,
            time: item.updatedAt ? formatTime(new Date(item.updatedAt)) : "Now",
            priority,
            status: "open" as const,
          };
        })
        .filter(Boolean);
    });

    // Calculate average from all stored environment readings (all sessions)
    const allReadingsCo2 = latestReadingByClass.filter(r => r.co2Ppm != null).map(r => r.co2Ppm);
    const allReadingsLight = latestReadingByClass.filter(r => r.lightLux != null).map(r => r.lightLux);
    const avgAllCo2 = allReadingsCo2.length > 0 
      ? Math.round(allReadingsCo2.reduce((a, b) => a + b, 0) / allReadingsCo2.length)
      : null;
    const avgAllLight = allReadingsLight.length > 0 
      ? Math.round(allReadingsLight.reduce((a, b) => a + (b <= 100 ? b : (b / 800) * 100), 0) / allReadingsLight.length)
      : null;
    const avgAllNoise = demoDataAllClasses.noise; // Use demo for noise since not stored

// Static average from all stored readings (for the fixed section - fetched via HTTP)
    // Use fixed reference time so demo data doesn't change between requests
    const fixedRefDate = new Date("2024-01-01T00:00:00Z");
    const demoForAvg = buildDemoEnvironmentSample("all-classes-avg-fixed", fixedRefDate);
    const environmentAverage = {
      co2: avgAllCo2 ?? demoForAvg.co2,
      light: avgAllLight ?? demoForAvg.light,
      noise: demoForAvg.noise,
      updatedAt: fixedRefDate.toISOString(),
    };

    // Live snapshot from sensor API (for real-time WebSocket updates during active sessions)
    const environmentSnapshot = buildEnvironmentSnapshot(sensorTelemetry?.telemetry) ?? {
      noise: demoDataAllClasses.noise,
      co2: demoDataAllClasses.co2,
      light: demoDataAllClasses.light,
      updatedAt: now.toISOString(),
    };

    const environmentTrend = buildEnvironmentTrend(environmentSnapshot);

    res.json({
      greeting: {
        adminName: greetingName,
        dateLabel: formatDateLabel(now),
        schoolName,
        alertsCount: openAlertsCount,
      },
summary: {
        totalStudents: studentCount,
        activeClasses: classCount,
        alertsToday: alertsTodayCount,
        teachersActive,
        liveSessions: liveSessionEnvironment.length,
        totalStudentsTrend,
        activeClassesTrend,
        alertsTrend,
        teachersTrend,
        avgEngagement,
        avgAttention,
        avgLiveCo2,
        avgLiveLight,
        avgLiveNoise,
        avgAllCo2,
        avgAllLight,
      },
analytics: {
        engagementTrend,
        environmentTrend,
        environmentSnapshot,
        environmentAverage,
        attentionByClass,
        liveSessionEnvironment,
      },
      teachers: teacherCards,
      alerts: [...liveEnvironmentAlerts.slice(0, 6), ...alertItems].slice(0, 10),
      support: {
        needsAttention,
        behavioralPatterns,
        interventions: [],
      },
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const [students, averageScores] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId, role: "STUDENT" },
        select: {
          id: true,
          fullName: true,
          email: true,
          dateOfBirth: true,
          createdAt: true,
          profile: { select: { phone: true, avatarUrl: true, bio: true } },
          enrollment: {
            select: {
              status: true,
              seatNumber: true,
              class: { select: { id: true, name: true } },
            },
          },
          studentXP: { select: { averageEngagement: true, averageConcentration: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.studentXP.aggregate({
        where: { student: { schoolId } },
        _avg: { averageEngagement: true, averageConcentration: true },
      }),
    ]);

    const avgEngagement = normalizeScore(averageScores._avg.averageEngagement);
    const avgAttention = normalizeScore(averageScores._avg.averageConcentration);

    let active = 0;
    let atRisk = 0;
    let flagged = 0;

    const studentRows = students.map((student) => {
      const engagement = normalizeScore(student.studentXP?.averageEngagement);
      const attention = normalizeScore(student.studentXP?.averageConcentration);
      const attendance = estimateAttendance(engagement, attention);
      const derived = deriveStudentStatus(engagement, attention);
      const initials = buildInitials(student.fullName);
      const tone = pickAvatarTone(student.id);

      if (derived.status === "active") {
        active += 1;
      } else if (derived.status === "risk") {
        atRisk += 1;
      } else {
        flagged += 1;
      }

      return {
        id: student.id,
        name: student.fullName,
        email: student.email,
        className: student.enrollment?.class?.name ?? "Unassigned",
        classId: student.enrollment?.class?.id ?? null,
        grade: student.enrollment?.class?.name ?? "General",
        status: derived.status,
        engagement,
        attendance,
        flag: derived.flag,
        avatar: initials,
        avatarBg: tone.bg,
        avatarColor: tone.color,
        age: calculateAge(student.dateOfBirth ?? null),
        enrollmentStatus: student.enrollment?.status ?? null,
        seatNumber: student.enrollment?.seatNumber ?? null,
        profile: {
          phone: student.profile?.phone ?? null,
          avatarUrl: student.profile?.avatarUrl ?? null,
          bio: student.profile?.bio ?? null,
        },
        createdAt: student.createdAt.toISOString(),
      };
    });

    res.json({
      stats: {
        total: students.length,
        active,
        atRisk,
        flagged,
      },
      students: studentRows,
      averages: {
        engagement: avgEngagement,
        attention: avgAttention,
      },
    });
  } catch (error) {
    console.error("getStudents error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getStudentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const studentId = req.params.studentId as string;
    const student = await prisma.user.findFirst({
      where: { id: studentId, schoolId, role: "STUDENT" },
      select: {
        id: true,
        fullName: true,
        email: true,
        dateOfBirth: true,
        createdAt: true,
        profile: { select: { phone: true, avatarUrl: true, bio: true } },
        enrollment: {
          select: {
            status: true,
            seatNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
        studentXP: { select: { totalXP: true } },
      },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found." });
      return;
    }

    const progressRows = await prisma.studentLessonProgress.findMany({
      where: { studentId },
      select: { progressPercent: true, isCompleted: true },
    });

    const trackedLessons = progressRows.length;
    const completedLessons = progressRows.filter((row) => row.isCompleted).length;
    const averageProgress = trackedLessons
      ? Math.round(
          progressRows.reduce((sum, row) => sum + (row.progressPercent ?? 0), 0) /
            trackedLessons,
        )
      : 0;

    res.json({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      age: calculateAge(student.dateOfBirth ?? null),
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString() : null,
      createdAt: student.createdAt.toISOString(),
      profile: {
        phone: student.profile?.phone ?? null,
        avatarUrl: student.profile?.avatarUrl ?? null,
        bio: student.profile?.bio ?? null,
      },
      enrollment: {
        status: student.enrollment?.status ?? null,
        seatNumber: student.enrollment?.seatNumber ?? null,
        class: student.enrollment?.class ?? null,
      },
      learning: {
        averageProgress,
        totalXp: student.studentXP?.totalXP ?? 0,
        completedLessons,
        trackedLessons,
      },
    });
  } catch (error) {
    console.error("getStudentDetail error:", error);
    res.status(500).json({ message: "Failed to fetch student detail" });
  }
};

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const now = new Date();
    const startMonth = new Date(now.getTime() - 30 * MS_PER_DAY);
    const dayEnum = dayEnumByIndex[now.getDay()] ?? "MONDAY";

    const [teachers, timetableEntries, classStudentCounts, sessions, avgEngagement] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId, role: "TEACHER" },
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          profile: { select: { phone: true, avatarUrl: true, bio: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.timetable.findMany({
        where: { teacher: { schoolId } },
        select: {
          teacherId: true,
          classId: true,
          day: true,
          subject: { select: { name: true } },
        },
      }),
      prisma.studentClass.groupBy({
        by: ["classId"],
        where: { class: { schoolId } },
        _count: { _all: true },
      }),
      prisma.session.findMany({
        where: { teacher: { schoolId } },
        select: {
          teacherId: true,
          createdAt: true,
          engagementScore: true,
        },
      }),
      prisma.session.aggregate({
        where: { teacher: { schoolId } },
        _avg: { engagementScore: true },
      }),
    ]);

    const classStudentCountMap = new Map<string, number>();
    classStudentCounts.forEach((row) => {
      classStudentCountMap.set(row.classId, row._count._all);
    });

    const classesByTeacher = new Map<string, Set<string>>();
    const subjectsByTeacher = new Map<string, Map<string, number>>();
    let classesToday = 0;

    timetableEntries.forEach((entry) => {
      const classSet = classesByTeacher.get(entry.teacherId) ?? new Set<string>();
      if (entry.classId) {
        classSet.add(entry.classId);
      }
      classesByTeacher.set(entry.teacherId, classSet);

      if (entry.subject?.name) {
        const subjectMap = subjectsByTeacher.get(entry.teacherId) ?? new Map<string, number>();
        subjectMap.set(entry.subject.name, (subjectMap.get(entry.subject.name) ?? 0) + 1);
        subjectsByTeacher.set(entry.teacherId, subjectMap);
      }

      if (entry.day === dayEnum) {
        classesToday += 1;
      }
    });

    const sessionsByTeacher = new Map<string, { latest: Date | null; scores: number[] }>();
    sessions.forEach((session) => {
      const entry = sessionsByTeacher.get(session.teacherId) ?? { latest: null, scores: [] };
      if (session.createdAt) {
        if (!entry.latest || session.createdAt > entry.latest) {
          entry.latest = session.createdAt;
        }
      }
      if (session.engagementScore !== null && session.engagementScore !== undefined) {
        entry.scores.push(session.engagementScore);
      }
      sessionsByTeacher.set(session.teacherId, entry);
    });

    const teacherRows = teachers.map((teacher) => {
      const classIds = classesByTeacher.get(teacher.id) ?? new Set<string>();
      const subjectMap = subjectsByTeacher.get(teacher.id);
      let primarySubject = "General";
      if (subjectMap && subjectMap.size > 0) {
        const sorted = Array.from(subjectMap.entries()).sort((a, b) => b[1] - a[1]);
        primarySubject = sorted[0][0];
      }

      const studentsTotal = Array.from(classIds).reduce(
        (sum, classId) => sum + (classStudentCountMap.get(classId) ?? 0),
        0,
      );

      const sessionEntry = sessionsByTeacher.get(teacher.id);
      const latestSession = sessionEntry?.latest ?? null;
      const lastActivity = latestSession ? formatRelativeTime(latestSession, now) : "No recent activity";
      const diffDays = latestSession ? Math.floor((now.getTime() - latestSession.getTime()) / MS_PER_DAY) : null;
      const status = diffDays === null ? "inactive" : diffDays <= 1 ? "active" : diffDays <= 7 ? "away" : "inactive";

      const rating = toRating(sessionEntry?.scores.length ? average(sessionEntry.scores) : null);
      const experienceYears = Math.floor((now.getTime() - teacher.createdAt.getTime()) / (365 * MS_PER_DAY));
      const experience = experienceYears > 0 ? `${experienceYears} yrs` : "New";
      const initials = buildInitials(teacher.fullName);
      const tone = pickAvatarTone(teacher.id);

      return {
        id: teacher.id,
        name: teacher.fullName,
        subject: primarySubject,
        classes: classIds.size,
        students: studentsTotal,
        rating,
        status,
        email: teacher.email,
        phone: teacher.profile?.phone ?? null,
        avatar: initials,
        avatarBg: tone.bg,
        avatarColor: tone.color,
        experience,
        lastActivity,
        schoolId,
        profile: {
          phone: teacher.profile?.phone ?? null,
          avatarUrl: teacher.profile?.avatarUrl ?? null,
          bio: teacher.profile?.bio ?? null,
        },
        createdAt: teacher.createdAt.toISOString(),
      };
    });

    const avgRating = teacherRows.length
      ? teacherRows.reduce((sum, teacher) => sum + teacher.rating, 0) / teacherRows.length
      : 0;

    const newThisMonth = teachers.filter((teacher) => teacher.createdAt >= startMonth).length;

    res.json({
      stats: {
        totalTeachers: teachers.length,
        classesToday,
        avgRating: Math.round(avgRating * 10) / 10,
        newThisMonth,
      },
      teachers: teacherRows,
    });
  } catch (error) {
    console.error("getTeachers error:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};

export const getTeacherDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const teacherId = req.params.teacherId as string;
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        schoolId: true,
        createdAt: true,
        profile: { select: { phone: true, avatarUrl: true, bio: true } },
      },
    });

    if (!teacher) {
      res.status(404).json({ message: "Teacher not found." });
      return;
    }

    const [timetables, sessions] = await Promise.all([
      prisma.timetable.findMany({
        where: { teacherId },
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      }),
      prisma.session.findMany({
        where: { teacherId },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const classIds = new Set(timetables.map((entry) => entry.classId));
    const classStudentCounts = classIds.size
      ? await prisma.studentClass.groupBy({
          by: ["classId"],
          where: { classId: { in: Array.from(classIds) } },
          _count: { _all: true },
        })
      : [];

    const countByClass = new Map<string, number>();
    classStudentCounts.forEach((row) => {
      countByClass.set(row.classId, row._count._all);
    });

    const timetableRows = timetables.map((entry) => ({
      id: entry.id,
      day: entry.day,
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime.toISOString(),
      class: {
        id: entry.class.id,
        name: entry.class.name,
        studentsCount: countByClass.get(entry.class.id) ?? 0,
      },
      subject: {
        id: entry.subject.id,
        name: entry.subject.name,
      },
    }));

    res.json({
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      schoolId: teacher.schoolId ?? null,
      createdAt: teacher.createdAt.toISOString(),
      profile: {
        phone: teacher.profile?.phone ?? null,
        avatarUrl: teacher.profile?.avatarUrl ?? null,
        bio: teacher.profile?.bio ?? null,
      },
      summary: {
        classesCount: classIds.size,
        timetableEntriesCount: timetables.length,
        sessionsCount: sessions.length,
      },
      timetable: timetableRows,
      recentSessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("getTeacherDetail error:", error);
    res.status(500).json({ message: "Failed to fetch teacher detail" });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const now = new Date();
    const startWeek = new Date(now.getTime() - 7 * MS_PER_DAY);
    const startMonth = new Date(now.getTime() - 6 * 30 * MS_PER_DAY);

    const [studentAverages, sessions, studentRows, subjects] = await Promise.all([
      prisma.studentXP.aggregate({
        where: { student: { schoolId } },
        _avg: { averageEngagement: true, averageConcentration: true },
      }),
      prisma.session.findMany({
        where: { teacher: { schoolId }, createdAt: { gte: startWeek } },
        select: { engagementScore: true, createdAt: true, subject: { select: { name: true } } },
      }),
      prisma.user.findMany({
        where: { schoolId, role: "STUDENT" },
        select: { studentXP: { select: { averageEngagement: true, averageConcentration: true } } },
      }),
      prisma.subject.findMany({ where: { schoolId }, select: { id: true, name: true } }),
    ]);

    const avgEngagement = normalizeScore(studentAverages._avg.averageEngagement);
    const avgAttention = normalizeScore(studentAverages._avg.averageConcentration);
    const avgAttendance = estimateAttendance(avgEngagement, avgAttention);

    const weeklyBuckets = new Map<string, number[]>();
    sessions.forEach((session) => {
      if (session.engagementScore === null || session.engagementScore === undefined) {
        return;
      }
      const key = toDateKey(session.createdAt);
      const list = weeklyBuckets.get(key) ?? [];
      list.push(session.engagementScore);
      weeklyBuckets.set(key, list);
    });

    const weeklyData = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now.getTime() - (6 - index) * MS_PER_DAY);
      const key = toDateKey(date);
      const scores = weeklyBuckets.get(key) ?? [];
      const engagement = scores.length ? average(scores) : avgEngagement;
      const attention = clamp(Math.round(engagement * 0.88 + 8), 0, 100);
      const attendance = clamp(Math.round(engagement * 0.92 + 6), 0, 100);
      return {
        day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
        engagement,
        attendance,
        attention,
      };
    });

    const monthlyAttendance = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(startMonth.getTime() + index * 30 * MS_PER_DAY);
      const drift = Math.round((Math.sin(index) + 1) * 3);
      return {
        month: formatMonthLabel(date),
        rate: clamp(avgAttendance + drift - 3, 0, 100),
      };
    });

    const subjectEngagement = subjects.map((subject, index) => {
      const subjectScores = sessions
        .filter((session) => session.subject?.name === subject.name)
        .map((session) => session.engagementScore ?? 0);
      const score = subjectScores.length
        ? average(subjectScores)
        : clamp(avgEngagement - index * 3, 0, 100);
      return { subject: subject.name, score };
    });

    const riskDistribution = (() => {
      let active = 0;
      let risk = 0;
      let flagged = 0;

      studentRows.forEach((student) => {
        const engagement = normalizeScore(student.studentXP?.averageEngagement);
        const attention = normalizeScore(student.studentXP?.averageConcentration);
        const derived = deriveStudentStatus(engagement, attention);
        if (derived.status === "active") {
          active += 1;
        } else if (derived.status === "risk") {
          risk += 1;
        } else {
          flagged += 1;
        }
      });

      return [
        { name: "Active", value: active, color: "#34D399" },
        { name: "At Risk", value: risk, color: "#FBBF24" },
        { name: "Flagged", value: flagged, color: "#F87171" },
      ];
    })();

    res.json({
      kpis: {
        avgEngagement,
        avgAttendance,
        avgAttention,
        interventions: 0,
      },
      weeklyData,
      monthlyAttendance,
      subjectEngagement,
      riskDistribution,
    });
  } catch (error) {
    console.error("getAnalytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const now = new Date();
    const startDay = startOfDay(now);

    const alerts = await prisma.sessionAlert.findMany({
      where: { session: { teacher: { schoolId } } },
      include: {
        session: {
          select: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    let open = 0;
    let resolved = 0;
    let totalResponseMinutes = 0;
    let responseCount = 0;

    const alertRows = alerts.map((alert) => {
      const typeLabel = formatAlertType(alert.alertType);
      const priority =
        alert.severity === "CRITICAL"
          ? "high"
          : alert.severity === "WARNING"
            ? "medium"
            : "low";
      const roomLabel = alert.session?.class?.name ?? alert.session?.subject?.name ?? "General";
      const status = alert.acknowledgedAt || alert.isRead ? "resolved" : "open";

      if (status === "open") {
        open += 1;
      } else {
        resolved += 1;
      }

      if (alert.acknowledgedAt) {
        totalResponseMinutes += Math.max(
          0,
          Math.round((alert.acknowledgedAt.getTime() - alert.createdAt.getTime()) / 60000),
        );
        responseCount += 1;
      }

      return {
        id: alert.id,
        title: typeLabel,
        desc: alert.message,
        type: typeLabel,
        room: roomLabel,
        time: formatTime(alert.createdAt),
        priority,
        status,
      };
    });

    const alertsToday = alerts.filter((alert) => alert.createdAt >= startDay).length;
    const avgResponseMin = responseCount
      ? Math.round(totalResponseMinutes / responseCount)
      : 0;

    res.json({
      stats: {
        totalAlerts: alertsToday,
        open,
        resolved,
        avgResponseMin,
      },
      alerts: alertRows,
    });
  } catch (error) {
    console.error("getAlerts error:", error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
};

export const resolveAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const alertId = req.params.alertId as string;
    const alert = await prisma.sessionAlert.findUnique({
      where: { id: alertId },
      include: { session: { select: { teacher: { select: { schoolId: true } } } } },
    });

    if (!alert || alert.session?.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Alert not found." });
      return;
    }

    await prisma.sessionAlert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user?.id ?? null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("resolveAlert error:", error);
    res.status(500).json({ message: "Failed to resolve alert" });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const now = new Date();
    const [studentsCount, teachersCount, sessionsCount, alertsCount] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
      prisma.user.count({ where: { schoolId, role: "TEACHER" } }),
      prisma.session.count({ where: { teacher: { schoolId } } }),
      prisma.sessionAlert.count({ where: { session: { teacher: { schoolId } } } }),
    ]);

    const availableReports = [
      {
        id: "student-progress",
        title: "Student Progress Report",
        desc: "Overall engagement, attention, and lesson completion trends.",
        lastGenerated: formatShortDate(now),
        size: "1.2 MB",
        type: "PDF" as const,
      },
      {
        id: "teacher-performance",
        title: "Teacher Performance Summary",
        desc: "Activity, sessions delivered, and classroom engagement scores.",
        lastGenerated: formatShortDate(now),
        size: "860 KB",
        type: "PDF" as const,
      },
      {
        id: "monthly-analytics",
        title: "Monthly Analytics Report",
        desc: "Attendance, engagement, and attention metrics for the month.",
        lastGenerated: formatShortDate(now),
        size: "2.4 MB",
        type: "XLSX" as const,
      },
      {
        id: "alert-log",
        title: "Alert & Incident Log",
        desc: "Chronological log of alerts and resolutions.",
        lastGenerated: formatShortDate(now),
        size: "420 KB",
        type: "CSV" as const,
      },
      {
        id: "attendance",
        title: "Attendance Summary",
        desc: "Class attendance trends and averages.",
        lastGenerated: formatShortDate(now),
        size: "640 KB",
        type: "PDF" as const,
      },
    ];

    const scheduledReports = [
      {
        title: "Weekly Student Pulse",
        schedule: "Every Monday, 7:00 AM",
        nextRun: formatShortDate(new Date(now.getTime() + 3 * MS_PER_DAY)),
        status: "active" as const,
      },
      {
        title: "Teacher Activity Digest",
        schedule: "1st of every month",
        nextRun: formatShortDate(new Date(now.getTime() + 15 * MS_PER_DAY)),
        status: "paused" as const,
      },
    ];

    res.json({
      stats: {
        reportsGenerated: sessionsCount + alertsCount,
        scheduledReports: scheduledReports.length,
        totalDownloads: Math.max(0, studentsCount + teachersCount),
        lastExportLabel: formatShortDate(now),
      },
      availableReports,
      scheduledReports,
    });
  } catch (error) {
    console.error("getReports error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export const getSessionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const teacherId = typeof req.query.teacherId === "string" ? req.query.teacherId : undefined;
    const status = typeof req.query.status === "string" && req.query.status ? req.query.status : undefined;
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw ?? 50)) : 50;

    const sessionWhere: any = {
      teacher: { schoolId },
    };

    if (teacherId) {
      sessionWhere.teacherId = teacherId;
    }

    if (status) {
      sessionWhere.status = status;
    }

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true, email: true } },
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const summary = sessions.reduce(
      (acc, session) => {
        acc.total += 1;
        if (session.status === "RECORDING") acc.recording += 1;
        if (session.status === "PROCESSING") acc.processing += 1;
        if (session.status === "WAITING_UPLOAD") acc.waitingUpload += 1;
        if (session.status === "COMPLETED") acc.completed += 1;
        if (session.status === "FAILED") acc.failed += 1;
        if (session.lessonPdfPath || session.advicePdfPath) acc.withPdf += 1;
        if (session.engagementScore !== null && session.engagementScore !== undefined) {
          acc.engagementTotal += session.engagementScore;
          acc.engagementCount += 1;
        }
        return acc;
      },
      {
        total: 0,
        recording: 0,
        processing: 0,
        waitingUpload: 0,
        completed: 0,
        failed: 0,
        withPdf: 0,
        engagementTotal: 0,
        engagementCount: 0,
      },
    );

    const averageEngagement = summary.engagementCount
      ? Math.round(summary.engagementTotal / summary.engagementCount)
      : 0;

    res.json({
      summary: {
        total: summary.total,
        recording: summary.recording,
        processing: summary.processing,
        waitingUpload: summary.waitingUpload,
        completed: summary.completed,
        failed: summary.failed,
        withPdf: summary.withPdf,
        averageEngagement,
      },
      sessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        startType: session.startType,
        createdAt: session.createdAt.toISOString(),
        actualStart: session.actualStart ? session.actualStart.toISOString() : null,
        actualEnd: session.actualEnd ? session.actualEnd.toISOString() : null,
        durationMinutes: session.durationMinutes ?? null,
        engagementScore: session.engagementScore ?? null,
        engagementBand: session.engagementBand ?? null,
        teacherRatio: session.teacherRatio ?? null,
        studentRatio: session.studentRatio ?? null,
        lessonPdfPath: session.lessonPdfPath ?? null,
        advicePdfPath: session.advicePdfPath ?? null,
        sessionJsonPath: session.sessionJsonPath ?? null,
        transcriptText: session.transcriptText ?? null,
        errorMessage: session.errorMessage ?? null,
        class: session.class ? { id: session.class.id, name: session.class.name } : null,
        subject: session.subject ? { id: session.subject.id, name: session.subject.name } : null,
        teacher: session.teacher,
        _count: session._count,
      })),
    });
  } catch (error) {
    console.error("getSessionHistory error:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

export const getSessionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const sessionId = req.params.sessionId as string;
const session = await prismaAny.session.findUnique({
      where: { id: sessionId },
      include: {
        class: { select: { id: true, name: true, schoolId: true } },
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true, email: true, schoolId: true } },
        timetable: true,
        visionAnalysis: {
          include: {
            students: {
              include: {
                student: {
                  select: {
                    id: true,
                    fullName: true,
                    enrollment: {
                      select: {
                        seatNumber: true,
                      },
                    },
                  },
                },
              },
              orderBy: [
                { seatNumber: "asc" },
                { detectedStudentId: "asc" },
              ],
            },
          },
        },
        alerts: {
          orderBy: { createdAt: "desc" },
        },
        environmentReadings: {
          select: {
            co2Ppm: true,
            temperatureC: true,
            humidityPct: true,
            lightLux: true,
            receivedAt: true,
          },
          orderBy: { receivedAt: "asc" },
        },
      },
    });

    if (!session || session.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    res.json({
      id: session.id,
      status: session.status,
      startType: session.startType,
      createdAt: session.createdAt.toISOString(),
      actualStart: session.actualStart ? session.actualStart.toISOString() : null,
      actualEnd: session.actualEnd ? session.actualEnd.toISOString() : null,
      durationMinutes: session.durationMinutes ?? null,
      engagementScore: session.engagementScore ?? null,
      engagementBand: session.engagementBand ?? null,
      teacherRatio: session.teacherRatio ?? null,
      studentRatio: session.studentRatio ?? null,
      lessonPdfPath: session.lessonPdfPath ?? null,
      advicePdfPath: session.advicePdfPath ?? null,
      sessionJsonPath: session.sessionJsonPath ?? null,
      visionJsonPath: null,
      visionAnnotatedVideoPath: session.visionAnalysis?.annotatedVideoPath ?? null,
      visionSmartOption: session.visionAnalysis?.smartOption ?? null,
      classEngagementAvg: session.visionAnalysis?.classEngagementAvg ?? null,
      classEngagementMin: session.visionAnalysis?.classEngagementMin ?? null,
      classEngagementMax: session.visionAnalysis?.classEngagementMax ?? null,
      classStudentCount: session.visionAnalysis?.classStudentCount ?? null,
      lowEngagementCount: session.visionAnalysis?.lowEngagementCount ?? null,
      totalFramesAnalyzed: session.visionAnalysis?.totalFramesAnalyzed ?? null,
      visionSummary: session.visionAnalysis?.summary ?? null,
      visionRaw: session.visionAnalysis?.raw ?? null,
      visionStudents: session.visionAnalysis?.students.map((row: any) => ({
        id: row.id,
        seatNumber: row.seatNumber,
        detectedStudentId: row.detectedStudentId,
        studentId: row.studentId,
        studentName: row.student?.fullName ?? null,
        seatNumberFromStudent: row.student?.enrollment?.seatNumber ?? null,
        meanCaes: row.meanCaes,
        minCaes: row.minCaes,
        maxCaes: row.maxCaes,
        framesAnalyzed: row.framesAnalyzed,
        trend: row.trend,
        lowEngagement: row.lowEngagement,
        payload: row.payload,
      })) ?? [],
      transcriptText: session.transcriptText ?? null,
      errorMessage: session.errorMessage ?? null,
      class: session.class ? { id: session.class.id, name: session.class.name, schoolId: session.class.schoolId } : null,
      subject: session.subject ? { id: session.subject.id, name: session.subject.name } : null,
      teacher: session.teacher,
      timetable: session.timetable
        ? {
            id: session.timetable.id,
            day: session.timetable.day,
            startTime: session.timetable.startTime.toISOString(),
            endTime: session.timetable.endTime.toISOString(),
          }
        : null,
alerts: session.alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.alertType,
        title: null,
        message: alert.message,
        severity: alert.severity,
        resolved: !!alert.acknowledgedAt || alert.isRead,
        createdAt: alert.createdAt.toISOString(),
      })),
      environment: session.environmentReadings.length > 0
        ? {
            avgCo2: Math.round(session.environmentReadings.reduce((sum: number, r: any) => sum + (r.co2Ppm ?? 0), 0) / session.environmentReadings.length),
            avgTemperature: Math.round(session.environmentReadings.reduce((sum: number, r: any) => sum + (r.temperatureC ?? 0), 0) / session.environmentReadings.length * 10) / 10,
            avgHumidity: Math.round(session.environmentReadings.reduce((sum: number, r: any) => sum + (r.humidityPct ?? 0), 0) / session.environmentReadings.length * 10) / 10,
            avgLight: Math.round(session.environmentReadings.reduce((sum: number, r: any) => sum + (r.lightLux ?? 0), 0) / session.environmentReadings.length),
            readingsCount: session.environmentReadings.length,
            readings: session.environmentReadings.map((r: any) => ({
              co2: r.co2Ppm,
              temperature: r.temperatureC,
              humidity: r.humidityPct,
              light: r.lightLux,
              receivedAt: r.receivedAt.toISOString(),
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("getSessionDetail error:", error);
    res.status(500).json({ message: "Failed to fetch session detail" });
  }
};

export const serveSessionLessonPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const sessionId = req.params.sessionId as string;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        lessonPdfPath: true,
        teacher: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!session || session.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    if (!session.lessonPdfPath) {
      res.status(404).json({ message: "Lesson PDF is not available for this session." });
      return;
    }

    const served = await servePdfFromStoredPath(res, session.lessonPdfPath, "lesson.pdf");
    if (!served) {
      res.status(404).json({ message: "PDF file not found on disk" });
    }
  } catch (error) {
    console.error("serveSessionLessonPdf error:", error);
    res.status(500).json({ message: "Failed to serve PDF" });
  }
};

export const serveSessionAdvicePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const sessionId = req.params.sessionId as string;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        advicePdfPath: true,
        teacher: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!session || session.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    if (!session.advicePdfPath) {
      res.status(404).json({ message: "Advice PDF is not available for this session." });
      return;
    }

    const served = await servePdfFromStoredPath(res, session.advicePdfPath, "advice.pdf");
    if (!served) {
      res.status(404).json({ message: "PDF file not found on disk" });
    }
  } catch (error) {
    console.error("serveSessionAdvicePdf error:", error);
    res.status(500).json({ message: "Failed to serve PDF" });
  }
};

export const startSessionAsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const body = req.body as AdminStartSessionInput;
    const teacher = await prisma.user.findFirst({
      where: { id: body.teacherId, role: "TEACHER", schoolId },
      select: { id: true },
    });

    if (!teacher) {
      res.status(404).json({ message: "Teacher not found in this school." });
      return;
    }

    const now = new Date();

    const session = await prisma.session.create({
      data: {
        teacherId: body.teacherId,
        timetableId: body.timetableId ?? null,
        classId: body.classId ?? null,
        subjectId: body.subjectId ?? null,
        startType: body.autoStart ? "AUTO" : "MANUAL",
        status: "RECORDING",
        actualStart: now,
      },
    });

    refreshEnvironmentIngest().catch((err) => {
      console.error("environmentIngest refresh failed:", err);
    });

    let fastApiForwarded = true;
    let fastApiWarning: string | null = null;

    try {
      const response = await fetch(`${FASTAPI_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          professor_id: body.teacherId,
          timetable_id: body.timetableId,
          class_id: body.classId,
          subject_id: body.subjectId,
          course_name: body.courseName,
          room_id: body.roomId,
          scheduled_duration_minutes: body.scheduledDurationMinutes,
          auto_start: body.autoStart,
          vision_smart_option: body.visionSmartOption,
        }),
      });

      if (!response.ok) {
        fastApiForwarded = false;
        fastApiWarning = "FastAPI start endpoint returned an error.";
      }
    } catch (err) {
      fastApiForwarded = false;
      fastApiWarning = "FastAPI could not be reached.";
      console.error("Failed to reach FastAPI for admin start session:", err);
    }

    res.status(201).json({
      success: true,
      fastApiForwarded,
      warning: fastApiWarning,
      session: {
        id: session.id,
        status: session.status,
        startType: session.startType,
        actualStart: session.actualStart,
      },
    });
  } catch (error) {
    console.error("startSessionAsAdmin error:", error);
    res.status(500).json({ message: "Failed to start session" });
  }
};

export const stopSessionAsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const body = req.body as AdminStopSessionInput;
    const session = await prisma.session.findUnique({
      where: { id: body.sessionId },
      include: { teacher: { select: { schoolId: true } } },
    });

    if (!session || session.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    await prisma.session.update({
      where: { id: body.sessionId },
      data: {
        status: "WAITING_UPLOAD",
        actualEnd: new Date(),
        durationMinutes: session.actualStart
          ? Math.round((Date.now() - session.actualStart.getTime()) / 60000)
          : null,
      },
    });

    refreshEnvironmentIngest().catch((err) => {
      console.error("environmentIngest refresh failed:", err);
    });

    let fastApiForwarded = true;
    let fastApiWarning: string | null = null;

    try {
      const response = await fetch(`${FASTAPI_URL}/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: body.sessionId,
          reason: body.reason,
        }),
      });

      if (!response.ok) {
        fastApiForwarded = false;
        fastApiWarning = "FastAPI stop endpoint returned an error.";
      }
    } catch (err) {
      fastApiForwarded = false;
      fastApiWarning = "FastAPI could not be reached.";
      console.error("Failed to reach FastAPI for admin stop session:", err);
    }

    res.json({
      success: true,
      fastApiForwarded,
      warning: fastApiWarning,
      session: {
        id: body.sessionId,
        status: "WAITING_UPLOAD",
        actualEnd: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("stopSessionAsAdmin error:", error);
    res.status(500).json({ message: "Failed to stop session" });
  }
};

export const analyzeSessionAsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) {
      return;
    }

    const sessionId = req.params.sessionId as string;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { teacher: { select: { schoolId: true } } },
    });

    if (!session || session.teacher?.schoolId !== schoolId) {
      res.status(404).json({ message: "Session not found." });
      return;
    }

    const analysis = {
      sessionId,
      engagementScore: session.engagementScore ?? 0,
      engagementBand: session.engagementBand ?? toBand(normalizeScore(session.engagementScore)),
      summary: session.errorMessage ?? "Analysis queued. Results will update once processing completes.",
      stressScore: null as number | null,
      stressBand: null as string | null,
      stressSummary: null as string | null,
      alerts: [],
    };

    res.json({ success: true, analysis, warning: "Live analysis is not configured." });
  } catch (error) {
    console.error("analyzeSessionAsAdmin error:", error);
    res.status(500).json({ message: "Failed to analyze session" });
  }
};
