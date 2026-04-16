# Learno

Learno is an AI-supported smart classroom platform. It combines:

- a modern multi-role web app (student, teacher, guardian, admin),
- a backend orchestration and data platform,
- an AI analysis service for classroom audio/video sessions,
- and an optional IoT telemetry pilot.

This repository is a workspace containing all services.

## Project at a glance (jury friendly)

- **For schools:** monitor sessions, engagement, alerts, and reports.
- **For teachers:** run sessions, review AI outputs, track classes and student support.
- **For students:** learn with chapter-based lessons, XP progress, focus mode, and neuro screeners.
- **For guardians:** follow child progress and communicate with teachers.

## Workspace map

```text
.
|- learno-web/
|  |- frontend/      # Main Next.js app (all dashboards)
|  |- backend/    # Express + Prisma API (auth, RBAC, realtime, AI integration)
|
|- learno-ai/     # FastAPI AI processing service (audio/video + lesson/advice generation)
|- learno-iot/    # ESP32 + telemetry pilot (kept separate)
```

## High-level architecture

```text
Users (Teacher / Student / Guardian / Admin)
                |
                v
      learno-web/learn (Next.js 16)
                |
                v
      learno-web/backend (Express + Socket.IO)
           |             \
           |              +--> realtime events (notifications, sessions, messages)
           |
           +--> PostgreSQL (Prisma ORM)
           |
           +--> learno-ai (FastAPI)
                    |
                    +--> webhook callbacks to backend
```

## Quick start (local demo)

### 1) Prerequisites

- Node.js 20+
- **Python 3.13.0** (required - use exactly this version for learno-ai)
- PostgreSQL
- FFmpeg (recommended for AI media processing)

### 2) Configure environment files

- Backend: copy `learno-web/backend/.env.example` to `learno-web/backend/.env` and fill required values.
- Frontend: create `learno-web/frontend/.env.local` with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_BASE_URL=http://localhost:4000
NEXT_PUBLIC_FASTAPI_WS_BASE_URL=ws://localhost:8000
```

- AI Service: copy `learno-ai/.env.example` to `learno-ai/.env` and fill in your API keys (GEMINI_API_KEY, HF_TOKEN, EXPRESS_WEBHOOK_KEY).

### 3) Initialize database (backend)

```bash
cd learno-web/backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 4) Run services (three terminals)

Backend:

```bash
cd learno-web/backend
npm run dev
```

AI service:

```bash
cd learno-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env and add your API keys
uvicorn api:app --reload --port 8000
```

Frontend:

```bash
cd learno-web/frontend
npm install
npm run dev
```

### 5) Open apps

- Main frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`
- AI health: `http://localhost:8000/health`
- Legacy frontend: `http://localhost:4000/app`

## Seed demo accounts

After `npx prisma db seed`:

- Admin: `admin@learno.com` / `Admin123!`
- Teacher: `farah@learno.com` / `Password123!`
- Guardian: `guardian@learno.com` / `Password123!`
- Students: `*@student.learno.com` / `Password123!`

## Documentation index

- `learno-web/README.md` - web workspace overview (frontend + backend)
- `learno-web/learn/README.md` - main frontend details
- `learno-web/backend/README.md` - backend API, security, data, and setup
- `learno-ai/README.md` - AI pipeline, models, endpoints, and setup
- `learno-web/frontend/README.md` - legacy static prototype
- `learno-web/backend/API_DOCS.md` - detailed endpoint reference
- `learno-web/backend/all.md` - backend architecture deep dive
- `RAPPORT_TECHNIQUE.md` - technical report
