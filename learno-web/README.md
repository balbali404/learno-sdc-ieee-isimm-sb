# Learno Web Workspace

`learno-web` contains all web-facing services and applications used in the Learno platform.

## What is inside

- `frontend`: the primary Next.js application (student, teacher, guardian, admin dashboards).
- `backend`: the Express + Prisma API layer (auth, RBAC, data, realtime, AI integration).


## Folder structure

```text
learno-web/
|- frontend/      # Main Next.js frontend (App Router)
|- backend/    # REST + Socket.IO backend, Prisma/PostgreSQL
```

## How the web stack works

```text
Browser (learn)
   |
   +--> REST calls to backend (/api/*)
   +--> Socket.IO connection to backend (realtime counters, alerts, messages)

backend
   |
   +--> PostgreSQL via Prisma
   +--> FastAPI AI service for session start/stop + webhook results
   +--> Optional IoT telemetry ingest for environment metrics
```

## Main capabilities by role

- **Student:** dashboard, lessons, chapter progression, focus mode, quizzes/progress, neuro tests, settings.
- **Teacher:** classes/students, neuro assignments, session analytics/history, reports, alerts, messaging, settings.
- **Guardian:** children overview, progress tracking, recommended tools, messaging, notifications, settings.
- **Admin:** school-level KPIs, students/teachers/classes, alerts, reports, session control/analysis, settings.

## Local setup (quick)

1. Configure and start backend (`learno-web/backend`).
2. Start AI service (`learno-ai`) so session integrations work.
3. Configure and start frontend (`learno-web/learn`).

Detailed setup instructions:

- `learno-web/backend/README.md`
- `learno-web/learn/README.md`

## Development URLs

- Frontend app: `http://localhost:3000`
- Backend API health: `http://localhost:4000/api/health`
- Legacy static frontend (served by backend): `http://localhost:4000/app`


