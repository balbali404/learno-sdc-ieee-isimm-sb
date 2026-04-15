import prisma from "../../config/prisma.js";
import { io } from "../socket.js";
import { refreshEnvironmentIngest } from "./environmentIngest.js";

const DAY_ORDER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const toDayIndex = (day: string): number => {
  const index = DAY_ORDER.indexOf(day.toUpperCase());
  return index === -1 ? 0 : index;
};

const toUtcMinutes = (value: Date): number => {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
};

const resolveFastApiBaseUrl = (): string => {
  const raw = process.env.FASTAPI_URL || "http://localhost:8000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};


const emitTeacherAlert = async (teacherId: string, message: string) => {
  await prisma.notification
    .create({
      data: {
        userId: teacherId,
        type: "AI_ALERT",
        title: "Session Update",
        message,
      },
    })
    .catch(() => null);

  io?.to(`user:${teacherId}`).emit("learno:alert", {
    message,
    severity: "WARNING",
  });
};

const autoStartSession = async (timetable: {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  subject: { name: string } | null;
  class: { name: string } | null;
  startTime: Date;
  endTime: Date;
}) => {
  const hasActiveSession = await prisma.session.findFirst({
    where: {
      teacherId: timetable.teacherId,
      status: { in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING"] },
    },
    select: { id: true },
  });

  if (hasActiveSession) {
    return null;
  }

  const alreadyStarted = await prisma.session.findFirst({
    where: {
      timetableId: timetable.id,
      status: { in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING", "COMPLETED"] },
      createdAt: { gte: new Date(Date.now() - 30 * 60000) },
    },
    select: { id: true },
  });

  if (alreadyStarted) {
    return null;
  }

  const session = await prisma.session.create({
    data: {
      teacherId: timetable.teacherId,
      timetableId: timetable.id,
      classId: timetable.classId,
      subjectId: timetable.subjectId,
      startType: "AUTO",
      status: "RECORDING",
      actualStart: new Date(),
      scheduledStart: timetable.startTime,
      scheduledEnd: timetable.endTime,
    },
  });

  refreshEnvironmentIngest().catch((err) => {
    console.error("environmentIngest refresh failed:", err);
  });

  try {
    await fetch(`${resolveFastApiBaseUrl()}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: session.id,
        professor_id: timetable.teacherId,
        timetable_id: timetable.id,
        class_id: timetable.classId,
        subject_id: timetable.subjectId,
        course_name: timetable.subject?.name ?? timetable.class?.name ?? "Class Session",
        scheduled_duration_minutes: 60,
        auto_start: true,
      }),
    });
  } catch {
    // ignore FastAPI failure; session exists locally
  }

  await emitTeacherAlert(
    timetable.teacherId,
    `Session auto-started for ${timetable.subject?.name ?? "Subject"} (${timetable.class?.name ?? "Class"}).`,
  );

  return session;
};

const autoStopSession = async (session: { id: string; teacherId: string; actualStart: Date | null }) => {
  await prisma.session.update({
    where: { id: session.id },
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

  try {
    await fetch(`${resolveFastApiBaseUrl()}/session/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id, reason: "auto_stop" }),
    });
  } catch {
    // ignore FastAPI failure
  }

  await emitTeacherAlert(session.teacherId, "Session auto-stopped at end of schedule.");
};

const markMissedSession = async (timetable: {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  class: { name: string } | null;
  subject: { name: string } | null;
  startTime: Date;
  endTime: Date;
}) => {
  const session = await prisma.session.create({
    data: {
      teacherId: timetable.teacherId,
      timetableId: timetable.id,
      classId: timetable.classId,
      subjectId: timetable.subjectId,
      startType: "AUTO",
      status: "FAILED",
      errorMessage: "Session missed (auto start did not occur).",
      scheduledStart: timetable.startTime,
      scheduledEnd: timetable.endTime,
    },
  });

  await prisma.sessionAlert
    .create({
      data: {
        sessionId: session.id,
        alertType: "SESSION_ENDED",
        severity: "WARNING",
        message: "Scheduled session missed.",
        data: {
          timetableId: timetable.id,
          classId: timetable.classId,
          subjectId: timetable.subjectId,
          missed: true,
        },
      },
    })
    .catch(() => null);

  await emitTeacherAlert(
    timetable.teacherId,
    `Scheduled session missed for ${timetable.subject?.name ?? "Subject"} (${timetable.class?.name ?? "Class"}).`,
  );
};

const shouldStartWindow = (nowMinutes: number, startMinutes: number) => {
  return nowMinutes >= startMinutes && nowMinutes <= startMinutes + 2;
};

const shouldStopWindow = (nowMinutes: number, endMinutes: number) => {
  return nowMinutes >= endMinutes && nowMinutes <= endMinutes + 2;
};

const shouldMarkMissed = (nowMinutes: number, endMinutes: number) => {
  return nowMinutes >= endMinutes + 1 && nowMinutes <= endMinutes + 10;
};

export const runSessionScheduler = async () => {
  const now = new Date();
  const dayIndex = now.getUTCDay();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const timetables = await prisma.timetable.findMany({
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  for (const entry of timetables) {
    if (toDayIndex(entry.day) !== dayIndex) {
      continue;
    }

    const startMinutes = toUtcMinutes(entry.startTime);
    const endMinutes = toUtcMinutes(entry.endTime);

    if (shouldStartWindow(nowMinutes, startMinutes)) {
      const existing = await prisma.session.findFirst({
        where: {
          timetableId: entry.id,
          status: { in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING"] },
          createdAt: { gte: new Date(now.getTime() - 3 * 60000) },
        },
      });
      if (!existing) {
        await autoStartSession(entry);
      }
    }

    if (shouldStopWindow(nowMinutes, endMinutes)) {
      const active = await prisma.session.findFirst({
        where: {
          timetableId: entry.id,
          status: "RECORDING",
        },
        orderBy: { createdAt: "desc" },
      });
      if (active) {
        await autoStopSession(active);
      }
    }

    if (shouldMarkMissed(nowMinutes, endMinutes)) {
      const hadSession = await prisma.session.findFirst({
        where: {
          timetableId: entry.id,
          createdAt: { gte: new Date(now.getTime() - 30 * 60000) },
          status: { in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING", "COMPLETED"] },
        },
      });
      if (!hadSession) {
        await markMissedSession(entry);
      }
    }
  }
};

export const startSessionScheduler = () => {
  const intervalMs = Number(process.env.SESSION_SCHEDULER_INTERVAL_MS ?? 60000);
  setInterval(() => {
    runSessionScheduler().catch((err) => {
      console.error("sessionScheduler error:", err);
    });
  }, intervalMs);
};
