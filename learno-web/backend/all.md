# Backend All-in-One Technical File (`all.md`)

This document describes backend architecture, layers, security, and all core technologies used in `learno-web/backend`.

## 1) Backend Purpose

The backend is the central orchestration service of Learno. It connects:

- frontend dashboards (`learno-web/learn` and legacy `/app`)
- PostgreSQL data storage (via Prisma)
- AI service (`learno-ai`) for session start/stop and processing results
- realtime clients through Socket.IO
- environment telemetry ingestion for live classroom conditions

## 2) Technologies Used

### Runtime and Framework

- Node.js (TypeScript project)
- Express 5
- HTTP server from Node core (`createServer`) to share Express + Socket.IO

### Data and ORM

- PostgreSQL
- Prisma ORM (`@prisma/client`)
- Prisma PostgreSQL adapter (`@prisma/adapter-pg`)

### Realtime

- Socket.IO server
- Room model (`user:*`, `conversation:*`, `class:*`, `session:*`)

### Security and Validation

- JWT (`jsonwebtoken`) for access token auth
- bcrypt for password hashing
- Zod for request payload validation
- cookie-parser for refresh-token cookie flow
- CORS middleware

### Tooling

- TypeScript
- tsx (dev runtime/watch)
- dotenv config loading

## 3) Layered Architecture

## Layer A - Transport/API Layer

Entry point: `src/server.ts`

- configures middleware
- mounts all route groups
- exposes health endpoint
- starts HTTP + Socket.IO servers
- starts background jobs (session scheduler, environment ingest refresh)

Mounted API groups:

- `/api/auth`
- `/api/school`
- `/api/teacher`
- `/api/guardian`
- `/api/messages`
- `/api/learno`
- `/api/student`
- `/api/admin`
- `/api/neuro`

## Layer B - Middleware and Policy Layer

Core middleware in `src/core/middleware`:

- `auth.middleware.ts` -> Bearer JWT verification and `req.user` injection
- `rbac.ts` -> role checks and same-school guard
- `validateRequest.ts` -> schema validation with Zod
- `errorHandler.ts` -> centralized error response strategy

This layer enforces who can call which endpoint and ensures payload correctness before business logic runs.

## Layer C - Domain Modules Layer

Business logic is split by module (`src/modules/*`):

- `auth` -> login/register/refresh/logout, account profile and password updates
- `school` -> school admin management of teachers/classes/subjects/timetable/enrollment
- `teacher` -> teacher dashboard and class/student operations
- `guardian` -> guardian-linked student flows and monitoring
- `student` -> lessons, chapter completion, progress, XP, engagement, settings
- `message` -> conversations, messages, unread state
- `learno` -> session lifecycle + webhook integration with AI pipeline
- `admin` -> school-level analytics, alerts, reports, session supervision
- `neuro` -> condition profile endpoints and neuro test assignment/review flows

Each module follows route -> controller (+ validators) style.

## Layer D - Integration Layer

External integrations include:

- **AI/FastAPI integration**
  - outbound session lifecycle calls (`start`, `stop`)
  - inbound webhook processing (`/api/learno/webhook`)
- **Environment telemetry integration**
  - ingest from sensor websocket and/or polling endpoint
  - automatic synthetic telemetry fallback for demo/live sessions without IoT

## Layer E - Data Layer

Prisma schema (`prisma/schema.prisma`) models:

- users, roles, schools, classes, timetable
- sessions and alerts
- lessons, chapters, progress, XP, achievements
- messaging and notification preferences
- neuro tests, assignments, condition history
- environment readings

Data access is done through Prisma clients in controllers and jobs.

## Layer F - Realtime Layer

Socket server in `src/core/socket.ts`:

- authenticates handshake token
- joins user and feature rooms
- supports class/session live streams
- emits message/session/environment updates to dashboards

## Layer G - Background Jobs Layer

Jobs in `src/core/jobs`:

- `sessionScheduler.ts` -> session-related scheduling logic
- `environmentIngest.ts` -> sensor ingest, fallback generation, persistence, realtime emit

## 4) Backend Runtime Flow (End-to-End)

```text
Frontend request
   -> Route (module)
      -> Auth/RBAC/Validation middleware
         -> Controller business logic
            -> Prisma queries/updates
            -> Optional external integration (FastAPI/sensors)
            -> Optional Socket.IO emit
               -> JSON response to client
```

For AI session flows:

```text
Teacher/Admin starts session
   -> backend creates/updates session
   -> backend calls FastAPI start endpoint
   -> FastAPI later sends webhook result
   -> backend persists lesson/alerts/metrics
   -> backend emits realtime updates
```

## 5) Security Used in Backend

### Authentication

- JWT Bearer access token for protected REST and socket handshake
- refresh token strategy with cookie + DB tracking

### Authorization

- role-based access checks (`checkRole`)
- school boundary protection (`sameSchoolOnly` + school checks in controllers)

### Input and Error Safety

- Zod validation for request bodies
- centralized error middleware with controlled output

### Password and Session Security

- bcrypt hashing
- refresh token rotation and invalidation strategy

### Integration Security

- webhook secret verification for AI callbacks

### Transport and Origin Controls

- CORS restricted to configured local origins in current setup
- credentials-enabled cookies for refresh flow

## 6) Demo and Fallback Strategy

To support demos when IoT is unavailable:

- environment ingest already supports synthetic telemetry fallback
- admin dashboard now also derives deterministic live demo values for active sessions when no sensor reading exists

Result: starting a session still produces visible environment metrics in admin dashboard and analytics cards.

## 7) Build and Run

### Scripts

- `npm run dev` -> watch mode (`tsx watch src/server.ts`)
- `npm run build` -> TypeScript compile
- `npm start` -> run compiled server

### Typical setup sequence

1. Configure `.env` from `.env.example`
2. Run Prisma migrate + generate
3. Start backend
4. Start frontend and AI service

## 8) Key Backend Files

- `src/server.ts`
- `src/core/socket.ts`
- `src/core/middleware/*`
- `src/core/jobs/environmentIngest.ts`
- `src/modules/*/*.routes.ts`
- `src/modules/*/*.controller.ts`
- `prisma/schema.prisma`
- `API_DOCS.md`
- `ERD.md`

---

This `all.md` is intentionally backend-only and focused on architecture, layers, security, and implementation stack.
