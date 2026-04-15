# Learno Backend API Documentation

**Base URL:** `http://localhost:4000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [School Management](#school-management)
- [Teacher](#teacher)
- [Guardian](#guardian)
- [Student](#student)
- [Learno AI (Sessions)](#learno-ai-sessions)
- [Messages](#messages)
- [Health Check](#health-check)

---

## Authentication

**Prefix:** `/api/auth`

### POST `/auth/login`

Login to the system with a specific role.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "TEACHER" // "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid_xxx",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "TEACHER",
    "schoolId": "school_xxx"
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `403`: Account is not registered as requested role

---

### POST `/auth/register`

Register a new Guardian account.

**Auth Required:** No

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid_xxx",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "GUARDIAN",
    "schoolId": null
  }
}
```

**Error Responses:**
- `409`: Email already in use

---

### POST `/auth/refresh-token`

Refresh access token using refresh token cookie.

**Auth Required:** No (uses httpOnly cookie)

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `401`: No refresh token provided / Invalid or expired refresh token

---

### POST `/auth/logout`

Logout and revoke refresh token.

**Auth Required:** Yes (Bearer token)

**Response (200):**
```json
{
  "message": "Logged out successfully."
}
```

---

### GET `/auth/me`

Get current authenticated user's profile.

**Auth Required:** Yes (Bearer token)

**Response (200):**
```json
{
  "user": {
    "id": "cuid_xxx",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "TEACHER",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "schoolId": "school_xxx",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "school": {
      "id": "school_xxx",
      "name": "Example School"
    },
    "profile": {
      "avatarUrl": "https://...",
      "phone": "+1234567890",
      "bio": "Teacher bio"
    },
    "age": 34
  }
}
```

---

### PUT `/auth/profile`

Update authenticated user's profile.

**Auth Required:** Yes (Bearer token)

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "dateOfBirth": "1990-01-15",
  "avatarUrl": "https://example.com/avatar.jpg",
  "phone": "+1234567890",
  "bio": "Updated bio"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully.",
  "user": {
    "id": "cuid_xxx",
    "fullName": "John Doe Updated",
    "email": "user@example.com",
    "role": "TEACHER",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "schoolId": "school_xxx",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "school": { "id": "school_xxx", "name": "Example School" },
    "profile": {
      "avatarUrl": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "bio": "Updated bio"
    },
    "age": 34
  }
}
```

---

### PUT `/auth/password`

Change authenticated user's password.

**Auth Required:** Yes (Bearer token)

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully. Please log in again."
}
```

**Error Responses:**
- `401`: Current password is incorrect
- `404`: User not found

---

## School Management

**Prefix:** `/api/school`

**Required Role:** `SCHOOL_ADMIN`

---

### POST `/school/co-admins`

Create a co-admin for the school. Password is auto-generated.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "fullName": "Co Admin Name",
  "email": "coadmin@school.com"
}
```

**Response (201):**
```json
{
  "message": "Co-admin created successfully.",
  "admin": {
    "id": "cuid_xxx",
    "fullName": "Co Admin Name",
    "email": "coadmin@school.com",
    "role": "SCHOOL_ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "generatedPassword": "Kx9#mP2vLq!n"
}
```

**Error Responses:**
- `409`: Email already in use

---

### POST `/school/teachers`

Create a teacher account. Password is auto-generated.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "fullName": "Teacher Name",
  "email": "teacher@school.com"
}
```

**Response (201):**
```json
{
  "message": "Teacher created successfully.",
  "teacher": {
    "id": "cuid_xxx",
    "fullName": "Teacher Name",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "generatedPassword": "Kx9#mP2vLq!n"
}
```

---

### GET `/school/teachers`

Get all teachers in the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "teachers": [
    {
      "id": "cuid_xxx",
      "fullName": "Teacher Name",
      "email": "teacher@school.com",
      "role": "TEACHER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "avatarUrl": "https://...",
        "phone": "+1234567890"
      }
    }
  ],
  "total": 1
}
```

---

### DELETE `/school/teachers/:id`

Remove a teacher from the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "message": "Teacher removed successfully."
}
```

**Error Responses:**
- `404`: Teacher not found in your school

---

### GET `/school/enrollments/pending`

Get pending student enrollments.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "enrollments": [
    {
      "id": "enrollment_xxx",
      "status": "PENDING",
      "enrolledAt": "2024-01-01T00:00:00.000Z",
      "student": {
        "id": "student_xxx",
        "fullName": "Student Name",
        "email": "student@example.com",
        "dateOfBirth": "2010-05-20T00:00:00.000Z"
      },
      "class": {
        "id": "class_xxx",
        "name": "Grade 5A"
      }
    }
  ],
  "total": 1
}
```

---

### POST `/school/enrollments/handle`

Approve or reject a pending enrollment.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "enrollmentId": "enrollment_xxx",
  "action": "APPROVED", // or "REJECTED"
  "seatNumber": 15 // Required for APPROVED
}
```

**Response (200) - Approved:**
```json
{
  "message": "Enrollment approved.",
  "enrollment": {
    "id": "enrollment_xxx",
    "status": "APPROVED",
    "seatNumber": 15,
    "student": { "id": "student_xxx", "fullName": "Student Name" },
    "class": { "id": "class_xxx", "name": "Grade 5A" }
  }
}
```

**Response (200) - Rejected:**
```json
{
  "message": "Enrollment rejected."
}
```

---

### GET `/school/students`

Get all students in the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "students": [
    {
      "id": "student_xxx",
      "fullName": "Student Name",
      "email": "student@example.com",
      "role": "STUDENT",
      "dateOfBirth": "2010-05-20T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "enrollment": [
        {
          "status": "APPROVED",
          "seatNumber": 15,
          "class": { "id": "class_xxx", "name": "Grade 5A" }
        }
      ]
    }
  ],
  "total": 1
}
```

---

### DELETE `/school/students/:id`

Remove a student from the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "message": "Student removed successfully."
}
```

---

### POST `/school/classes`

Create a new class.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "name": "Grade 5A"
}
```

**Response (201):**
```json
{
  "message": "Class created successfully.",
  "class": {
    "id": "class_xxx",
    "name": "Grade 5A",
    "schoolId": "school_xxx",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/school/classes`

Get all classes in the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "classes": [
    {
      "id": "class_xxx",
      "name": "Grade 5A",
      "schoolId": "school_xxx",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "_count": { "students": 25 }
    }
  ],
  "total": 1
}
```

---

### DELETE `/school/classes/:id`

Delete a class.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "message": "Class deleted successfully."
}
```

---

### POST `/school/subjects`

Create a new subject.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "name": "Mathematics"
}
```

**Response (201):**
```json
{
  "message": "Subject created successfully.",
  "subject": {
    "id": "subject_xxx",
    "name": "Mathematics",
    "schoolId": "school_xxx"
  }
}
```

**Error Responses:**
- `409`: Subject already exists in your school

---

### GET `/school/subjects`

Get all subjects in the school.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "subjects": [
    {
      "id": "subject_xxx",
      "name": "Mathematics",
      "schoolId": "school_xxx"
    }
  ],
  "total": 1
}
```

---

### DELETE `/school/subjects/:id`

Delete a subject.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "message": "Subject deleted successfully."
}
```

---

### POST `/school/timetable`

Create a timetable entry.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Request Body:**
```json
{
  "teacherId": "teacher_xxx",
  "classId": "class_xxx",
  "subjectId": "subject_xxx",
  "day": "MONDAY",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

**Response (201):**
```json
{
  "message": "Timetable entry created.",
  "timetable": {
    "id": "timetable_xxx",
    "teacherId": "teacher_xxx",
    "classId": "class_xxx",
    "subjectId": "subject_xxx",
    "day": "MONDAY",
    "startTime": "1970-01-01T09:00:00.000Z",
    "endTime": "1970-01-01T10:00:00.000Z",
    "teacher": { "id": "teacher_xxx", "fullName": "Teacher Name" },
    "class": { "id": "class_xxx", "name": "Grade 5A" },
    "subject": { "id": "subject_xxx", "name": "Mathematics" }
  }
}
```

---

### GET `/school/timetable`

Get school timetable.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "timetable": [
    {
      "id": "timetable_xxx",
      "day": "MONDAY",
      "startTime": "1970-01-01T09:00:00.000Z",
      "endTime": "1970-01-01T10:00:00.000Z",
      "teacher": { "id": "teacher_xxx", "fullName": "Teacher Name" },
      "class": { "id": "class_xxx", "name": "Grade 5A" },
      "subject": { "id": "subject_xxx", "name": "Mathematics" }
    }
  ],
  "total": 1
}
```

---

### DELETE `/school/timetable/:id`

Delete a timetable entry.

**Auth Required:** Yes (SCHOOL_ADMIN)

**Response (200):**
```json
{
  "message": "Timetable entry deleted successfully."
}
```

---

## Teacher

**Prefix:** `/api/teacher`

**Required Role:** `TEACHER`

---

### GET `/teacher/dashboard`

Get teacher dashboard data.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
{
  "teacher": {
    "id": "teacher_xxx",
    "fullName": "Teacher Name",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "schoolId": "school_xxx",
    "profile": { "avatarUrl": "...", "phone": "...", "bio": "..." },
    "school": { "id": "school_xxx", "name": "Example School" }
  },
  "unreadNotifications": 5,
  "unreadMessages": 3,
  "nextSession": {
    "id": "timetable_xxx",
    "day": "MONDAY",
    "startTime": "...",
    "endTime": "...",
    "class": { "id": "...", "name": "Grade 5A" },
    "subject": { "id": "...", "name": "Mathematics" }
  },
  "totalClasses": 4
}
```

---

### GET `/teacher/classes`

Get classes taught by the teacher.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
[
  {
    "id": "class_xxx",
    "name": "Grade 5A",
    "studentCount": 25,
    "subjects": ["Mathematics", "Science"],
    "schedules": [
      { "day": "MONDAY", "startTime": "...", "endTime": "..." }
    ]
  }
]
```

---

### GET `/teacher/classes/:classId/students`

Get students in a specific class.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
[
  {
    "id": "enrollment_xxx",
    "status": "APPROVED",
    "seatNumber": 15,
    "student": {
      "id": "student_xxx",
      "fullName": "Student Name",
      "email": "student@example.com",
      "profile": { "avatarUrl": "..." }
    }
  }
]
```

**Error Responses:**
- `403`: You do not teach this class

---

### GET `/teacher/students`

Get all students from classes taught by the teacher.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
[
  {
    "id": "enrollment_xxx",
    "student": {
      "id": "student_xxx",
      "fullName": "Student Name",
      "email": "student@example.com",
      "profile": { "avatarUrl": "..." }
    },
    "class": { "id": "class_xxx", "name": "Grade 5A" }
  }
]
```

---

### GET `/teacher/timetable`

Get teacher's timetable.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
[
  {
    "id": "timetable_xxx",
    "day": "MONDAY",
    "startTime": "1970-01-01T09:00:00.000Z",
    "endTime": "1970-01-01T10:00:00.000Z",
    "class": { "id": "class_xxx", "name": "Grade 5A" },
    "subject": { "id": "subject_xxx", "name": "Mathematics" }
  }
]
```

---

### GET `/teacher/notifications`

Get teacher's notifications.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
[
  {
    "id": "notif_xxx",
    "userId": "teacher_xxx",
    "type": "AI_ALERT",
    "title": "Session Processing Complete",
    "message": "Your classroom session has been analyzed.",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### PATCH `/teacher/notifications/:id/read`

Mark notification as read.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
{
  "id": "notif_xxx",
  "userId": "teacher_xxx",
  "type": "AI_ALERT",
  "title": "Session Processing Complete",
  "message": "...",
  "read": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET `/teacher/settings`

Get notification preferences.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
{
  "id": "pref_xxx",
  "userId": "teacher_xxx",
  "urgentAlerts": true,
  "environmentWarnings": true,
  "sessionSummaries": true,
  "weeklyReports": false,
  "soundAlerts": false
}
```

---

### PATCH `/teacher/settings`

Update notification preferences.

**Auth Required:** Yes (TEACHER)

**Request Body:**
```json
{
  "urgentAlerts": true,
  "environmentWarnings": false,
  "sessionSummaries": true,
  "weeklyReports": true,
  "soundAlerts": true
}
```

**Response (200):**
```json
{
  "id": "pref_xxx",
  "userId": "teacher_xxx",
  "urgentAlerts": true,
  "environmentWarnings": false,
  "sessionSummaries": true,
  "weeklyReports": true,
  "soundAlerts": true
}
```

---

### GET `/teacher/profile`

Get teacher's profile.

**Auth Required:** Yes (TEACHER)

**Response (200):**
```json
{
  "id": "teacher_xxx",
  "fullName": "Teacher Name",
  "email": "teacher@school.com",
  "role": "TEACHER",
  "schoolId": "school_xxx",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "school": { "id": "school_xxx", "name": "Example School" },
  "profile": {
    "avatarUrl": "...",
    "phone": "...",
    "bio": "..."
  }
}
```

---

### PATCH `/teacher/profile`

Update teacher's profile.

**Auth Required:** Yes (TEACHER)

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "avatarUrl": "https://...",
  "phone": "+1234567890",
  "bio": "Updated bio"
}
```

**Response (200):**
```json
{
  "id": "teacher_xxx",
  "fullName": "Updated Name",
  "email": "teacher@school.com",
  "role": "TEACHER",
  "profile": {
    "avatarUrl": "https://...",
    "phone": "+1234567890",
    "bio": "Updated bio"
  }
}
```

---

### POST `/teacher/students`

Create a student and enroll in a class. Password is auto-generated.

**Auth Required:** Yes (TEACHER)

**Request Body:**
```json
{
  "fullName": "New Student",
  "email": "newstudent@example.com",
  "dateOfBirth": "2010-05-20",
  "classId": "class_xxx"
}
```

**Response (201):**
```json
{
  "message": "Student created and enrolled successfully.",
  "student": {
    "id": "student_xxx",
    "fullName": "New Student",
    "email": "newstudent@example.com",
    "role": "STUDENT",
    "dateOfBirth": "2010-05-20T00:00:00.000Z",
    "schoolId": "school_xxx"
  },
  "enrollment": {
    "id": "enrollment_xxx",
    "classId": "class_xxx",
    "status": "APPROVED"
  },
  "generatedPassword": "Kx9#mP2vLq!n"
}
```

**Error Responses:**
- `403`: You do not teach this class
- `404`: Class not found in your school
- `409`: Email already in use

---

## Guardian

**Prefix:** `/api/guardian`

**Auth Required:** Yes (GUARDIAN role only)

Guardian can register their children (students) to a school and track their progress.

---

### GET `/guardian/schools`

Get list of available schools (for enrollment form).

**Response (200):**
```json
{
  "schools": [
    { "id": "school_xxx", "name": "Springfield Elementary" },
    { "id": "school_yyy", "name": "Shelbyville High" }
  ],
  "total": 2
}
```

---

### GET `/guardian/schools/:schoolId/classes`

Get classes for a specific school (for enrollment form).

**Response (200):**
```json
{
  "school": { "id": "school_xxx", "name": "Springfield Elementary" },
  "classes": [
    { "id": "class_xxx", "name": "Grade 5A" },
    { "id": "class_yyy", "name": "Grade 5B" }
  ],
  "total": 2
}
```

**Errors:**
- `404`: School not found

---

### POST `/guardian/students`

Create a student account and request enrollment to a school/class.
Password is auto-generated and returned in the response.

**Request Body:**
```json
{
  "fullName": "Ahmed Junior",
  "email": "ahmed.junior@example.com",
  "dateOfBirth": "2015-05-20",
  "schoolId": "school_xxx",
  "classId": "class_xxx"
}
```

**Response (201):**
```json
{
  "message": "Student created successfully. Awaiting school approval.",
  "student": {
    "id": "student_xxx",
    "fullName": "Ahmed Junior",
    "email": "ahmed.junior@example.com",
    "dateOfBirth": "2015-05-20T00:00:00.000Z"
  },
  "enrollment": {
    "id": "enrollment_xxx",
    "classId": "class_xxx",
    "className": "Grade 5A",
    "schoolId": "school_xxx",
    "schoolName": "Springfield Elementary",
    "status": "PENDING"
  },
  "generatedPassword": "Kx9#mP2vLq!n"
}
```

**Errors:**
- `404`: School not found / Class not found in this school
- `409`: Email already in use

---

### GET `/guardian/students`

Get all students linked to this guardian.

**Response (200):**
```json
{
  "students": [
    {
      "id": "student_xxx",
      "fullName": "Ahmed Junior",
      "email": "ahmed.junior@example.com",
      "dateOfBirth": "2015-05-20T00:00:00.000Z",
      "schoolId": "school_xxx",
      "school": { "id": "school_xxx", "name": "Springfield Elementary" },
      "enrollment": {
        "id": "enrollment_xxx",
        "status": "APPROVED",
        "seatNumber": 12,
        "class": { "id": "class_xxx", "name": "Grade 5A" }
      }
    }
  ],
  "total": 1
}
```

---

### GET `/guardian/students/:studentId`

Get detailed information about a specific student.

**Response (200):**
```json
{
  "student": {
    "id": "student_xxx",
    "fullName": "Ahmed Junior",
    "email": "ahmed.junior@example.com",
    "dateOfBirth": "2015-05-20T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "school": { "id": "school_xxx", "name": "Springfield Elementary" },
    "enrollment": {
      "id": "enrollment_xxx",
      "status": "APPROVED",
      "seatNumber": 12,
      "enrolledAt": "2024-01-01T10:00:00.000Z",
      "class": { "id": "class_xxx", "name": "Grade 5A" }
    },
    "profile": { "avatarUrl": null }
  }
}
```

**Errors:**
- `403`: You are not linked to this student
- `404`: Student not found

---

### GET `/guardian/students/:studentId/progress`

Get a student's learning progress, XP, and achievements.

**Response (200):**
```json
{
  "xp": {
    "totalXP": 1250,
    "level": 5
  },
  "recentLessons": [
    {
      "id": "progress_xxx",
      "status": "COMPLETED",
      "score": 85,
      "lesson": {
        "id": "lesson_xxx",
        "title": "Introduction to Fractions",
        "subject": { "name": "Mathematics" }
      }
    }
  ],
  "recentAchievements": [
    {
      "id": "student_achievement_xxx",
      "unlockedAt": "2024-01-15T14:30:00.000Z",
      "achievement": {
        "id": "achievement_xxx",
        "name": "Quick Learner",
        "description": "Complete 5 lessons in one day",
        "icon": "/icons/quick-learner.png",
        "xpReward": 100
      }
    }
  ]
}
```

**Errors:**
- `403`: You are not linked to this student

---

## Student

**Prefix:** `/api/student`

**Auth Required:** Yes (various roles depending on endpoint)

---

### GET `/student/lessons`

Get lessons (teachers see all, students see approved only).

**Auth Required:** Yes (STUDENT or TEACHER)

**Query Parameters:**
- `status` (optional): Filter by status (TEACHER only)
- `subjectId` (optional): Filter by subject
- `difficulty` (optional): BEGINNER, INTERMEDIATE, ADVANCED
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "lessons": [
    {
      "id": "lesson_xxx",
      "title": "Introduction to Algebra",
      "description": "Learn basic algebraic concepts",
      "status": "APPROVED",
      "difficulty": "BEGINNER",
      "totalXP": 100,
      "totalDurationMin": 45,
      "subject": { "id": "...", "name": "Mathematics", "color": "#4285f4" },
      "chapters": [
        { "id": "...", "chapterNumber": 1, "title": "Variables", "xpReward": 25 }
      ],
      "_count": { "progress": 50 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET `/student/lessons/drafts`

Get draft lessons awaiting approval.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
[
  {
    "id": "lesson_xxx",
    "title": "Draft Lesson",
    "status": "DRAFT",
    "subject": { "id": "...", "name": "Mathematics", "color": "#4285f4" },
    "session": { "id": "...", "actualStart": "...", "actualEnd": "..." },
    "chapters": [
      { "id": "...", "chapterNumber": 1, "title": "Chapter 1", "xpReward": 25, "summary": "..." }
    ]
  }
]
```

---

### GET `/student/lessons/:lessonId`

Get lesson details.

**Auth Required:** Yes (STUDENT or TEACHER)

**Response (200):**
```json
{
  "id": "lesson_xxx",
  "title": "Introduction to Algebra",
  "description": "Learn basic algebraic concepts",
  "status": "APPROVED",
  "difficulty": "BEGINNER",
  "gradeLevel": 5,
  "totalXP": 100,
  "totalDurationMin": 45,
  "learningObjectives": ["Understand variables", "Solve simple equations"],
  "keyVocabulary": ["variable", "coefficient", "expression"],
  "subject": { "id": "...", "name": "Mathematics", "color": "#4285f4" },
  "session": { "id": "...", "actualStart": "...", "actualEnd": "...", "transcriptText": "..." },
  "chapters": [
    {
      "id": "chapter_xxx",
      "chapterNumber": 1,
      "title": "Variables",
      "content": "Full chapter content...",
      "summary": "Brief summary",
      "durationMin": 10,
      "readingTimeSec": 180,
      "xpReward": 25,
      "keyInsight": "Variables represent unknown values"
    }
  ]
}
```

**Error Responses:**
- `403`: Lesson not available (students can't view unapproved lessons)
- `404`: Lesson not found

---

### POST `/student/lessons/approve`

Approve a draft lesson.

**Auth Required:** Yes (TEACHER only)

**Request Body:**
```json
{
  "lessonId": "lesson_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson approved and published",
  "lesson": {
    "id": "lesson_xxx",
    "title": "Introduction to Algebra",
    "status": "APPROVED",
    "isPublished": true,
    "approvedBy": "teacher_xxx",
    "approvedAt": "2024-01-01T00:00:00.000Z",
    "subject": { "id": "...", "name": "Mathematics" },
    "chapters": [{ "id": "...", "title": "Variables" }]
  }
}
```

**Error Responses:**
- `400`: Only draft lessons can be approved
- `403`: You can only approve your own lessons
- `404`: Lesson not found

---

### POST `/student/lessons/reject`

Reject a draft lesson.

**Auth Required:** Yes (TEACHER only)

**Request Body:**
```json
{
  "lessonId": "lesson_xxx",
  "reason": "Content needs revision"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson rejected",
  "lesson": {
    "id": "lesson_xxx",
    "status": "REJECTED",
    "rejectionReason": "Content needs revision",
    "isPublished": false
  }
}
```

---

### GET `/student/dashboard`

Get student dashboard data.

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
{
  "xp": {
    "id": "xp_xxx",
    "studentId": "student_xxx",
    "totalXP": 1500,
    "level": 5,
    "currentStreak": 7,
    "longestStreak": 14,
    "dailyXPEarned": 50,
    "lastActivityDate": "2024-01-01T00:00:00.000Z"
  },
  "recentProgress": [
    {
      "id": "progress_xxx",
      "lessonId": "lesson_xxx",
      "chaptersCompleted": 3,
      "progressPercent": 75,
      "xpEarned": 75,
      "isCompleted": false,
      "lesson": {
        "id": "lesson_xxx",
        "title": "Introduction to Algebra",
        "totalXP": 100,
        "subjectColor": "#4285f4",
        "subject": { "name": "Mathematics", "color": "#4285f4" },
        "chapters": [{ "id": "..." }]
      }
    }
  ],
  "newAchievements": [
    {
      "id": "achievement_xxx",
      "achievementId": "ach_xxx",
      "isNew": true,
      "achievement": { "name": "First Steps", "description": "Complete your first lesson" }
    }
  ],
  "availableLessonsCount": 25
}
```

---

### GET `/student/xp`

Get student's XP and level.

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
{
  "id": "xp_xxx",
  "studentId": "student_xxx",
  "totalXP": 1500,
  "level": 5,
  "currentStreak": 7,
  "longestStreak": 14,
  "dailyXPEarned": 50,
  "lastActivityDate": "2024-01-01T00:00:00.000Z"
}
```

---

### GET `/student/progress`

Get student's lesson progress.

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
[
  {
    "id": "progress_xxx",
    "studentId": "student_xxx",
    "lessonId": "lesson_xxx",
    "chaptersCompleted": 3,
    "progressPercent": 75,
    "xpEarned": 75,
    "timeSpentMin": 30,
    "isCompleted": false,
    "completedAt": null,
    "rating": null,
    "lesson": {
      "id": "lesson_xxx",
      "title": "Introduction to Algebra",
      "totalXP": 100,
      "totalDurationMin": 45,
      "subject": { "name": "Mathematics", "color": "#4285f4" }
    }
  }
]
```

---

### POST `/student/lessons/start`

Start a lesson (creates progress record).

**Auth Required:** Yes (STUDENT only)

**Request Body:**
```json
{
  "lessonId": "lesson_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "progress": {
    "id": "progress_xxx",
    "studentId": "student_xxx",
    "lessonId": "lesson_xxx",
    "chaptersCompleted": 0,
    "progressPercent": 0,
    "xpEarned": 0,
    "lastAccessedAt": "2024-01-01T00:00:00.000Z"
  },
  "chapters": [
    { "id": "chapter_xxx", "chapterNumber": 1, "title": "Variables", "xpReward": 25 }
  ]
}
```

**Error Responses:**
- `404`: Lesson not available

---

### POST `/student/chapters/complete`

Complete a chapter and earn XP.

**Auth Required:** Yes (STUDENT only)

**Request Body:**
```json
{
  "chapterId": "chapter_xxx",
  "timeSpentMin": 12
}
```

**Response (200):**
```json
{
  "success": true,
  "xpEarned": 25,
  "totalXP": 1525,
  "progressPercent": 100,
  "lessonCompleted": true,
  "newAchievements": [
    { "id": "ach_xxx", "name": "Quick Learner", "xpReward": 50 }
  ]
}
```

**Socket Event Emitted:** `xp:earned`
```json
{
  "xpEarned": 25,
  "totalXP": 1525,
  "chapterId": "chapter_xxx",
  "lessonCompleted": true,
  "newAchievements": [...]
}
```

---

### POST `/student/lessons/rate`

Rate a lesson.

**Auth Required:** Yes (STUDENT only)

**Request Body:**
```json
{
  "lessonId": "lesson_xxx",
  "rating": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rating submitted"
}
```

**Error Responses:**
- `400`: You must start the lesson before rating

---

### GET `/student/achievements`

Get all achievements with unlock status.

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
[
  {
    "id": "ach_xxx",
    "name": "First Steps",
    "description": "Complete your first lesson",
    "iconUrl": "https://...",
    "xpReward": 50,
    "category": "PROGRESS",
    "isHidden": false,
    "sortOrder": 1,
    "xpRequired": null,
    "lessonsRequired": 1,
    "streakRequired": null,
    "unlocked": true,
    "unlockedAt": "2024-01-01T00:00:00.000Z",
    "isNew": false
  }
]
```

---

### GET `/student/achievements/unlocked`

Get student's unlocked achievements.

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
[
  {
    "id": "student_ach_xxx",
    "studentId": "student_xxx",
    "achievementId": "ach_xxx",
    "unlockedAt": "2024-01-01T00:00:00.000Z",
    "xpAwarded": 50,
    "isNew": false,
    "achievement": {
      "id": "ach_xxx",
      "name": "First Steps",
      "description": "Complete your first lesson",
      "iconUrl": "https://...",
      "xpReward": 50
    }
  }
]
```

---

### PATCH `/student/achievements/:achievementId/seen`

Mark achievement as seen (remove "new" badge).

**Auth Required:** Yes (STUDENT only)

**Response (200):**
```json
{
  "success": true
}
```

---

## Learno AI (Sessions)

**Prefix:** `/api/learno`

---

### POST `/learno/webhook`

Receive webhook events from FastAPI processing service.

**Auth Required:** No (uses webhook secret in Authorization header)

**Headers:**
```
Authorization: Bearer <WEBHOOK_SECRET>
```

**Request Body:**
```json
{
  "event": "processing_complete",
  "session_id": "session_xxx",
  "data": {
    "sessionId": "session_xxx",
    "teacherId": "teacher_xxx",
    "engagementScore": 85,
    "engagementBand": "HIGH",
    "teacherRatio": 60,
    "studentRatio": 40,
    "transcriptText": "Full transcript...",
    "lessonData": { ... },
    "alerts": [ ... ]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "event": "processing_complete"
}
```

**Error Responses:**
- `401`: Invalid webhook secret
- `400`: Invalid payload

---

### GET `/learno/timetable/:teacherId`

Get teacher's timetable for today (used by FastAPI for auto-start).

**Auth Required:** No (uses webhook secret)

**Headers:**
```
Authorization: Bearer <WEBHOOK_SECRET>
```

**Response (200):**
```json
{
  "teacherId": "teacher_xxx",
  "today": "MONDAY",
  "timetable": [
    {
      "id": "timetable_xxx",
      "teacherId": "teacher_xxx",
      "classId": "class_xxx",
      "subjectId": "subject_xxx",
      "day": "MONDAY",
      "startTime": "1970-01-01T09:00:00.000Z",
      "endTime": "1970-01-01T10:00:00.000Z",
      "class": { "id": "class_xxx", "name": "Grade 5A" },
      "subject": { "id": "subject_xxx", "name": "Mathematics" },
      "durationMinutes": 60
    }
  ]
}
```

---

### POST `/learno/sessions/start`

Start a recording session.

**Auth Required:** Yes (TEACHER only)

**Request Body:**
```json
{
  "timetableId": "timetable_xxx",
  "classId": "class_xxx",
  "subjectId": "subject_xxx",
  "courseName": "Mathematics 101",
  "roomId": "room_a1",
  "scheduledDurationMinutes": 45,
  "autoStart": true,
  "gradeLevel": 10,
  "studentAge": 15
}
```

**Response (201):**
```json
{
  "success": true,
  "session": {
    "id": "session_xxx",
    "status": "RECORDING",
    "startType": "AUTO",
    "actualStart": "2024-01-01T09:00:00.000Z"
  }
}
```

---

### POST `/learno/sessions/stop`

Stop a recording session.

**Auth Required:** Yes (TEACHER only)

**Request Body:**
```json
{
  "sessionId": "session_xxx",
  "reason": "Class ended"
}
```

**Response (200):**
```json
{
  "success": true,
  "sessionId": "session_xxx",
  "status": "waiting_upload"
}
```

**Error Responses:**
- `404`: Session not found

---

### GET `/learno/sessions`

Get teacher's sessions.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
[
  {
    "id": "session_xxx",
    "teacherId": "teacher_xxx",
    "status": "COMPLETED",
    "startType": "MANUAL",
    "actualStart": "2024-01-01T09:00:00.000Z",
    "actualEnd": "2024-01-01T09:45:00.000Z",
    "durationMinutes": 45,
    "engagementScore": 85,
    "engagementBand": "HIGH",
    "class": { "id": "class_xxx", "name": "Grade 5A" },
    "subject": { "id": "subject_xxx", "name": "Mathematics" },
    "_count": { "alerts": 2 }
  }
]
```

---

### GET `/learno/sessions/:sessionId`

Get session details.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
{
  "id": "session_xxx",
  "teacherId": "teacher_xxx",
  "status": "COMPLETED",
  "startType": "MANUAL",
  "actualStart": "2024-01-01T09:00:00.000Z",
  "actualEnd": "2024-01-01T09:45:00.000Z",
  "durationMinutes": 45,
  "engagementScore": 85,
  "engagementBand": "HIGH",
  "teacherRatio": 60,
  "studentRatio": 40,
  "teacherMinutes": 27,
  "studentMinutes": 18,
  "silenceCount": 3,
  "longestSilenceSec": 45,
  "totalSilenceSec": 120,
  "transcriptText": "Full transcript...",
  "class": { "id": "class_xxx", "name": "Grade 5A" },
  "subject": { "id": "subject_xxx", "name": "Mathematics" },
  "timetable": { ... },
  "recording": { ... },
  "lessonSummary": {
    "id": "summary_xxx",
    "title": "Algebra Basics",
    "summary": "This lesson covered...",
    "fullContent": "Full content...",
    "wordCount": 2500,
    "estimatedReadMinutes": 13
  },
  "teacherAdvice": {
    "id": "advice_xxx",
    "overallScore": 85,
    "overallFeedback": "Great session!",
    "recommendations": ["More student interaction", "Use visual aids"]
  },
  "alerts": [
    {
      "id": "alert_xxx",
      "alertType": "LONG_SILENCE",
      "message": "Long silence detected",
      "severity": "WARNING",
      "createdAt": "2024-01-01T09:30:00.000Z"
    }
  ]
}
```

---

### GET `/learno/sessions/:sessionId/alerts`

Get session alerts.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
[
  {
    "id": "alert_xxx",
    "sessionId": "session_xxx",
    "alertType": "LONG_SILENCE",
    "message": "Long silence detected (45 seconds)",
    "severity": "WARNING",
    "data": { "silenceDuration": 45 },
    "createdAt": "2024-01-01T09:30:00.000Z"
  }
]
```

---

### GET `/learno/lessons`

Get all lessons for the current teacher.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
[
  {
    "id": "lesson_xxx",
    "title": "Introduction to Algebra",
    "subject": "Mathematics",
    "status": "APPROVED",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]
```

---

### POST `/learno/lessons/:lessonId/approve`

Approve an AI-generated lesson.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson approved successfully",
  "lesson": {
    "id": "lesson_xxx",
    "status": "APPROVED"
  }
}
```

---

### GET `/learno/lessons/:lessonId/pdf`

Download or serve the PDF for a specific lesson.

**Auth Required:** Yes (TEACHER only)

**Response (200):**
- Returns PDF file with appropriate headers
- Content-Type: `application/pdf`

**Response (404):**
```json
{
  "error": "Lesson not found"
}
```

---

## Messages

**Prefix:** `/api/messages`

**Auth Required:** Yes (any authenticated user)

---

### GET `/messages/conversations`

Get user's conversations.

**Auth Required:** Yes

**Response (200):**
```json
[
  {
    "id": "conv_xxx",
    "otherUser": {
      "id": "user_xxx",
      "fullName": "John Teacher",
      "role": "TEACHER",
      "profile": { "avatarUrl": "https://..." }
    },
    "lastMessage": {
      "id": "msg_xxx",
      "content": "Hello!",
      "senderId": "user_xxx",
      "status": "SENT",
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    "lastMessageAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### GET `/messages/participants`

Get available participants for starting new conversations.

Role-aware behavior:
- `TEACHER`: guardians linked to students in classes taught by the teacher
- `GUARDIAN`: teachers linked to classes of the guardian's children
- Other roles: users in the same school

**Auth Required:** Yes

**Response (200):**
```json
[
  {
    "id": "user_xxx",
    "fullName": "Fatima Guardian",
    "role": "GUARDIAN",
    "profile": { "avatarUrl": null },
    "context": {
      "students": ["Ali Hassan"],
      "classes": ["Grade 5A"],
      "subjects": ["Mathematics", "Science"]
    }
  }
]
```

---

### POST `/messages/conversations`

Start a new conversation.

**Auth Required:** Yes

**Request Body:**
```json
{
  "participantId": "user_xxx"
}
```

**Response (200):**
```json
{
  "id": "conv_xxx",
  "participantA": "user_xxx",
  "participantB": "user_yyy",
  "lastMessageAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Cannot start a conversation with yourself
- `403`: Cross-school messaging is not allowed
- `404`: User not found

---

### GET `/messages/conversations/:id/messages`

Get messages in a conversation.

**Auth Required:** Yes

**Response (200):**
```json
[
  {
    "id": "msg_xxx",
    "conversationId": "conv_xxx",
    "senderId": "user_xxx",
    "content": "Hello!",
    "status": "READ",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

**Error Responses:**
- `403`: You don't have access to this conversation

---

### POST `/messages/conversations/:id/messages`

Send a message.

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "Hello, how are you?"
}
```

**Response (201):**
```json
{
  "id": "msg_xxx",
  "conversationId": "conv_xxx",
  "senderId": "user_xxx",
  "content": "Hello, how are you?",
  "status": "SENT",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Socket Events Emitted:**
- `message:new` - to conversation room
- `message:notification` - to other participant

---

### PATCH `/messages/:id/read`

Mark a message as read.

**Auth Required:** Yes

**Response (200):**
```json
{
  "id": "msg_xxx",
  "conversationId": "conv_xxx",
  "senderId": "other_user",
  "content": "Hello!",
  "status": "READ",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Socket Event Emitted:** `message:read`

**Error Responses:**
- `403`: Cannot mark this message as read
- `404`: Message not found

---

### GET `/messages/unread-count`

Get unread message count.

**Auth Required:** Yes

**Response (200):**
```json
{
  "unreadCount": 5
}
```

---

## Health Check

### GET `/api/health`

Check API health status.

**Auth Required:** No

**Response (200):**
```json
{
  "status": "ok",
  "uptime": 3600.123,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Socket.IO Events

The server emits real-time events via Socket.IO:

### Rooms
- `user:{userId}` - User-specific notifications
- `teacher:{teacherId}` - Teacher-specific events
- `conversation:{conversationId}` - Conversation messages

### Events
| Event | Description |
|-------|-------------|
| `message:new` | New message in conversation |
| `message:notification` | Message notification for recipient |
| `message:read` | Message marked as read |
| `learno:session_complete` | Session processing completed |
| `learno:session_failed` | Session processing failed |
| `learno:alert` | Real-time session alert |
| `lesson:approved` | Lesson approved notification |
| `xp:earned` | Student earned XP |

---

## Authentication

Include the access token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

The refresh token is stored as an httpOnly cookie and used automatically by the `/auth/refresh-token` endpoint.

---

## Learno AI WebSocket (FastAPI)

**Base URL:** `ws://localhost:8000`

### Teacher WebSocket

**Endpoint:** `ws://localhost:8000/ws/teacher/{teacher_id}`

Connect to receive auto-start/stop notifications and session updates.

**On Connect:**
- Server checks timetable for upcoming sessions
- If session scheduled within 2 minutes: sends auto-start countdown

**Events Received:**

| Event | Description |
|-------|-------------|
| `connected` | Connection confirmed |
| `upcoming_session` | Session starting soon |
| `auto_start_alert` | Auto-start countdown begins (5 seconds) |
| `auto_start_countdown` | Countdown tick (5, 4, 3, 2, 1, 0) |
| `session_auto_started` | Session started automatically |
| `auto_start_failed` | Failed to auto-start |
| `auto_stop_alert` | Session time up, stopping in 5 seconds |
| `auto_stop_countdown` | Stop countdown tick |
| `session_auto_stopped` | Session stopped automatically |
| `session_extended` | Session duration extended |
| `active_session` | Info about current active session |

**Events to Send:**

| Event | Description |
|-------|-------------|
| `ping` | Keep-alive ping |
| `cancel_auto_start` | Cancel auto-start countdown |
| `extend_session` | Extend session duration |
| `check_timetable` | Check for upcoming sessions |

**Example: Extend Session**
```json
{
  "type": "extend_session",
  "session_id": "session_xxx",
  "minutes": 15
}
```

### Session WebSocket

**Endpoint:** `ws://localhost:8000/ws/{session_id}`

Connect to receive real-time processing progress.

**Events Received:**
| Event | Description |
|-------|-------------|
| `session_state` | Current session state |
| `progress` | Processing progress (0-100%) |
| `alert` | Session alert (silence, engagement, etc.) |
| `status` | Status update |
| `error` | Processing error |

---

## Recording File Naming

Recordings are saved with descriptive filenames:

**Format:** `{teacherId}_{date}_{subjectId}_{classId}_{time}.wav`

**Example:** `abc12345_20240315_math001_cls001_093045.wav`

This helps identify:
- Which teacher recorded
- Date of recording
- Subject and class
- Exact time
