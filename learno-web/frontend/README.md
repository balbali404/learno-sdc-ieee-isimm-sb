# Learno Main Frontend (`learn`)

`learno-web/learn` is the primary Learno web application.

It is built with Next.js 16 + React 19 and delivers role-based dashboards for:

- students,
- teachers,
- guardians,
- school admins.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Socket.IO client
- Motion (`motion/react`) for UI animation
- Recharts for analytics charts

## App responsibilities

- Authentication and role-based access control on the client side.
- Dashboard experiences per role.
- Realtime counters/notifications/messages updates.
- Session controls and AI result visualization.
- Student lesson reading flows with chapter progression and XP feedback.
- Neuro test assignment and student screener workflows.

## Route map

### Public

- `/login`

### Student (`/student/*`)

- `/student`
- `/student/lessons`
- `/student/lessons/[lessonId]`
- `/student/focus`
- `/student/neuro-tests`
- `/student/quizzes`
- `/student/progress`
- `/student/settings`

### Teacher (`/teacher/*`)

- `/teacher`
- `/teacher/classes`
- `/teacher/students`
- `/teacher/neuro-tests`
- `/teacher/neuro-tests/assignments/[assignmentId]`
- `/teacher/analytics`
- `/teacher/alerts`
- `/teacher/history`
- `/teacher/reports`
- `/teacher/messages`
- `/teacher/settings`

### Guardian (`/guardian/*`)

- `/guardian`
- `/guardian/children`
- `/guardian/progress`
- `/guardian/recommended-tools`
- `/guardian/messages`
- `/guardian/notifications`
- `/guardian/settings`

### Admin (`/admin/*`)

- `/admin`
- `/admin/students`
- `/admin/students/[studentId]`
- `/admin/teachers`
- `/admin/teachers/[teacherId]`
- `/admin/classes`
- `/admin/analytics`
- `/admin/alerts`
- `/admin/reports`
- `/admin/sessions`
- `/admin/settings`

## Feature breakdown by role

### Student

- Personalized dashboard with XP/progress components.
- Lesson catalog and chapter-based lesson reading.
- Dedicated full-page lesson detail route: `/student/lessons/[lessonId]`.
- Chapter progression lock/unlock + XP completion flow.
- Local lesson reading session continuity on refresh (chapter/timer progress restored).
- Focus mode + smart attention camera helper UI.
- Neuro test list/attempt flows.
- Quiz and engagement/progress screens.
- Profile and notification settings.

### Teacher

- Dashboard overview and upcoming class context.
- Class and student management views.
- Neuro assignment management and recommendations.
- Session history/analytics and alert views.
- Messaging center.
- Notification and profile/settings management.

### Guardian

- Child registration and child overview screens.
- Child progress tracking + neuro assignment visibility.
- Recommended tools panel.
- Messaging and notifications.
- Guardian settings.

### Admin

- School-level dashboard summary cards and analytics.
- Student and teacher management pages.
- Classes and reports.
- Alerts triage/resolution.
- Session supervision (start/stop/analyze, detail, PDF retrieval).

## Frontend architecture

```text
src/app
|- layout.tsx                    # root layout + realtime provider
|- login/
|- (dashboards)/
   |- student/
   |- teacher/
   |- guardian/
   |- admin/

src/components
|- auth/                         # role protection and auth helpers
|- dashboard/
   |- student/
   |- teacher/
   |- guardian/
   |- admin/
   |- shared/                    # realtime dashboard provider, shared notifications/messages

src/lib
|- api/                          # typed API clients by module
|- config.ts                     # base URLs and storage keys
|- themes.ts                     # student neuro-adaptive visual theming
|- getStudentCondition.ts        # condition fetch + normalization
```

## API integration

API clients are under `src/lib/api`:

- `authApi`
- `schoolApi`
- `teacherApi`
- `guardianApi`
- `studentApi`
- `adminApi`
- `learnoApi`
- `messagesApi`
- `neuroApi`

All clients use shared `apiRequest` (`src/lib/api/http.ts`) with:

- token attachment,
- refresh-token fallback,
- unified error handling.

## Realtime integration

- Global realtime wrapper: `src/components/dashboard/shared/RealtimeDashboardProvider.tsx`.
- Socket backend base URL from `NEXT_PUBLIC_SOCKET_BASE_URL`.
- Used for message notifications, dashboard counters, and live session/event updates.

## Environment configuration

Create `learno-web/learn/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_BASE_URL=http://localhost:4000
NEXT_PUBLIC_FASTAPI_WS_BASE_URL=ws://localhost:8000
```

Defaults are defined in `src/lib/config.ts` if values are omitted.

## Local development

### Prerequisites

- Node.js 20+
- Backend running at `http://localhost:4000`
- AI service running at `http://localhost:8000` for session/websocket-dependent features

### Install

```bash
npm install
```

### Run (development)

```bash
npm run dev
```

Open: `http://localhost:3000`

## Build and production run

```bash
npm run build
npm start
```

## Linting

```bash
npm run lint
```

## Related docs

- `learno-web/README.md` - web workspace overview
- `learno-web/backend/README.md` - backend architecture and API
- `learno-ai/README.md` - AI service details
