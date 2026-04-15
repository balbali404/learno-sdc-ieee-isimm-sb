# Learno Backend (`learno-web/backend`)

`learno-web/backend` is the central API and orchestration layer for Learno.

It connects frontend dashboards, database persistence, realtime channels, AI processing callbacks, and optional IoT/environment ingestion.

## Core responsibilities

- Authentication (login/register/refresh/logout) and user profile flows.
- Role-based authorization for `STUDENT`, `TEACHER`, `GUARDIAN`, `SCHOOL_ADMIN`, `SUPER_ADMIN`.
- School operations (teachers, students, classes, subjects, timetable).
- Student learning domain (lessons, chapters, progress, XP, achievements).
- Neuro-adaptive domain (conditions, tests, assignments, attempts, reviews).
- Session lifecycle orchestration with FastAPI AI service.
- Webhook intake from AI processing service.
- Messaging + notifications.
- Realtime events through Socket.IO.
- Environment telemetry ingestion (sensor + synthetic fallback).

## Technology stack

- Node.js + TypeScript
- Express 5
- Prisma ORM + PostgreSQL
- Socket.IO
- JWT + bcrypt
- Zod request validation

## Backend architecture

```text
src/
|- server.ts                   # app bootstrap, middleware, routes, health, jobs
|- config/
|  |- prisma.ts                # Prisma client
|- core/
|  |- middleware/              # auth, rbac, validation, error handling
|  |- socket.ts                # Socket.IO auth + rooms/events
|  |- jobs/
|     |- sessionScheduler.ts   # auto start/stop/missed session checks
|     |- environmentIngest.ts  # sensor ingest + fallback metrics
|- modules/
|  |- auth/
|  |- school/
|  |- teacher/
|  |- guardian/
|  |- student/
|  |- learno/
|  |- admin/
|  |- neuro/
|  |- message/
|- utils/

prisma/
|- schema.prisma               # full data model
|- migrations/
|- seed.ts                     # demo data + accounts
```

## API route modules

Mounted in `src/server.ts`:

- `/api/auth`
- `/api/school`
- `/api/teacher`
- `/api/guardian`
- `/api/messages`
- `/api/learno`
- `/api/student`
- `/api/admin`
- `/api/neuro`

Detailed endpoint contract: `API_DOCS.md`.

## Security model

- Bearer JWT access token (`authenticate` middleware).
- Role authorization (`checkRole`).
- Refresh-token flow using HTTP-only cookie + DB token tracking.
- Zod validation (`validate`) for request payloads.
- Webhook secret protection for AI callback endpoints.
- Socket.IO token validation at handshake.
- Centralized error middleware (`errorHandler`).

## Realtime model

Socket server (`src/core/socket.ts`) supports room patterns:

- `user:{userId}`
- `conversation:{conversationId}`
- `class:{classId}`
- `session:{sessionId}`

Used for message events, notification updates, session alerts, XP events, and environment updates.

## AI integration

Backend integration module: `src/modules/learno`.

- Starts/stops sessions and forwards commands to FastAPI.
- Receives webhook events from AI (`/api/learno/webhook`).
- Persists generated outputs (session metrics, alerts, lesson/advice artifacts).
- Emits realtime updates to relevant clients.

## Database and ORM

Prisma schema: `prisma/schema.prisma`.

Major model groups:

- identity and RBAC: `User`, `School`, `UserProfile`
- academic structure: `Class`, `Subject`, `Timetable`, `StudentClass`
- sessions and AI: `Session`, `Recording`, `SessionAlert`, `LessonSummary`, `TeacherAdvice`, `WebhookLog`
- student learning: `Lesson`, `Chapter`, `StudentLessonProgress`, `StudentChapterProgress`, `StudentFocusSession`, `StudentXP`, `Achievement`, `StudentAchievement`
- neuro-adaptive: `NeuroCondition`, `NeuroTest`, `NeuroTestAssignment`, `NeuroTestAttempt`, `StudentNeuroProfile`, `StudentNeuroConditionRecord`
- messaging and notifications: `Conversation`, `Message`, `Notification`, `NotificationPreference`
- environment telemetry: `EnvironmentReading`

## Environment and configuration

Copy `learno-web/backend/.env.example` to `learno-web/backend/.env`.

Required baseline variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `WEBHOOK_SECRET`

Common optional variables:

- `PORT`, `FRONTEND_URL`, `JSON_BODY_LIMIT`
- `FASTAPI_URL` (used by scheduler/session integration flows)
- sensor ingest settings (`SENSOR_*`)

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL

### Install dependencies

```bash
npm install
```

### Prisma workflow

Generate client:

```bash
npx prisma generate
```

Run migrations (recommended for evolving schema):

```bash
npx prisma migrate dev
```

Alternative for rapid sync in development (no migration file):

```bash
npx prisma db push
```

Seed demo data:

```bash
npx prisma db seed
```

### Run in development

```bash
npm run dev
```

Health endpoint: `http://localhost:4000/api/health`

### Build and run production bundle

```bash
npm run build
npm start
```

## NPM scripts

- `npm run dev` - start watch mode with `tsx`
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run compiled server
- `npm run test:webhooks` - helper webhook script

## Seeded demo accounts

From `prisma/seed.ts`:

- Admin: `admin@learno.com` / `Admin123!`
- Teacher: `farah@learno.com` / `Password123!`
- Guardian: `guardian@learno.com` / `Password123!`
- Students: `*@student.learno.com` / `Password123!`

## Additional docs

- `API_DOCS.md` - endpoint-level API reference
- `ERD.md` - data model notes
- `all.md` - detailed backend architecture and security narrative

## Important security note

- Never commit real secrets to source control.
- Rotate any credentials/tokens found in development code before production deployment.
