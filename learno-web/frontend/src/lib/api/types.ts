export type Role =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN";

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LessonStatus = "DRAFT" | "APPROVED" | "REJECTED" | "ARCHIVED";

export type SessionStatus =
  | "PENDING"
  | "RECORDING"
  | "WAITING_UPLOAD"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface UserProfile {
  avatarUrl: string | null;
  phone?: string | null;
  bio?: string | null;
}

export interface BasicUser {
  id: string;
  fullName: string;
  email?: string;
  role: Role;
  schoolId?: string | null;
  profile?: UserProfile | null;
}

export interface ClassRef {
  id: string;
  name: string;
}

export interface SubjectRef {
  id: string;
  name: string;
  color?: string;
}

export interface TimetableEntry {
  id: string;
  teacherId?: string;
  classId: string;
  subjectId: string;
  day: string;
  startTime: string;
  endTime: string;
  class?: ClassRef;
  subject?: SubjectRef;
}

export interface TeacherDashboard {
  teacher: BasicUser | null;
  unreadNotifications: number;
  unreadMessages: number;
  nextSession: TimetableEntry | null;
  totalClasses: number;
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  studentCount: number;
  subjects: string[];
  schedules: Array<{ day: string; startTime: string; endTime: string }>;
}

export interface ClassEnvironmentReading {
  id: string;
  classId?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
  co2Ppm?: number | null;
  temperatureC?: number | null;
  humidityPct?: number | null;
  lightLux?: number | null;
  receivedAt: string;
}

export interface TeacherStudentEnrollment {
  id: string;
  status?: EnrollmentStatus;
  seatNumber?: number | null;
  student: BasicUser;
  class?: ClassRef;
  attentionScore?: number;
  vision?: {
    meanCaes?: number | null;
    minCaes?: number | null;
    maxCaes?: number | null;
    trend?: string | null;
    lowEngagement?: boolean;
    classEngagementAvg?: number | null;
    sessionId?: string | null;
    sessionCreatedAt?: string | null;
  } | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationFeedResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface TeacherSettings {
  id: string;
  userId: string;
  urgentAlerts: boolean;
  environmentWarnings: boolean;
  sessionSummaries: boolean;
  weeklyReports: boolean;
  soundAlerts: boolean;
}

export interface TeacherProfile extends BasicUser {
  createdAt?: string;
  school?: { id: string; name: string } | null;
  profile?: UserProfile | null;
}

export interface LearnoSession {
  id: string;
  teacherId: string;
  classId?: string | null;
  subjectId?: string | null;
  status: SessionStatus;
  startType?: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  createdAt?: string;
  durationMinutes?: number | null;
  engagementScore?: number | null;
  engagementBand?: string | null;
  teacherRatio?: number | null;
  studentRatio?: number | null;
  teacherMinutes?: number | null;
  studentMinutes?: number | null;
  lessonPdfPath?: string | null;
  advicePdfPath?: string | null;
  sessionJsonPath?: string | null;
  visionAnalysis?: {
    id: string;
    smartOption?: string | null;
    classEngagementAvg?: number | null;
    classEngagementMin?: number | null;
    classEngagementMax?: number | null;
    classStudentCount?: number | null;
    lowEngagementCount?: number | null;
    totalFramesAnalyzed?: number | null;
    annotatedVideoPath?: string | null;
  } | null;
  class?: ClassRef | null;
  subject?: SubjectRef | null;
  _count?: { alerts: number };
}

export interface SessionHistoryItem {
  id: string;
  status: SessionStatus;
  startType: string;
  createdAt: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  durationMinutes?: number | null;
  engagementScore?: number | null;
  engagementBand?: string | null;
  teacherRatio?: number | null;
  studentRatio?: number | null;
  lessonPdfPath?: string | null;
  advicePdfPath?: string | null;
  sessionJsonPath?: string | null;
  visionJsonPath?: null;
  visionAnnotatedVideoPath?: string | null;
  visionSmartOption?: string | null;
  transcriptText?: string | null;
  errorMessage?: string | null;
  class?: ClassRef | null;
  subject?: SubjectRef | null;
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
  _count?: {
    alerts: number;
  };
}

export interface SessionHistoryResponse {
  summary: {
    total: number;
    recording: number;
    processing: number;
    waitingUpload: number;
    completed: number;
    failed: number;
    withPdf: number;
    averageEngagement: number;
  };
  sessions: SessionHistoryItem[];
}

export interface LessonChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary?: string | null;
  content?: string;
  xpReward?: number;
  durationMin?: number;
  readingTimeSec?: number;
  keyInsight?: string | null;
  keyPoints?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  description?: string | null;
  status: LessonStatus;
  difficulty?: string;
  totalXP?: number;
  totalDurationMin?: number;
  rating?: number;
  ratingCount?: number;
  studentsEnrolled?: number;
  completionRate?: number;
  subjectColor?: string | null;
  createdAt?: string;
  approvedAt?: string | null;
  subject?: SubjectRef | null;
  session?: {
    id: string;
    class?: ClassRef | null;
    subject?: SubjectRef | null;
  } | null;
  chapters?: LessonChapter[];
  studentProgress?: {
    progressPercent?: number;
    chaptersCompleted?: number;
    isCompleted?: boolean;
    completedChapterIds?: string[];
  };
  learningObjectives?: string[];
  keyVocabulary?: Array<string | { term: string; definition?: string }>;
  pdfPath?: string | null;
  _count?: { progress?: number };
}

export interface StudentXP {
  id?: string;
  studentId?: string;
  totalXP: number;
  currentLevel?: number;
  level?: number;
  xpToNextLevel?: number;
  currentStreak?: number;
  longestStreak?: number;
  dailyXPEarned?: number;
  dailyLessonsDone?: number;
  lastActivityDate?: string | null;
}

export interface StudentLessonProgress {
  id: string;
  lessonId: string;
  chaptersCompleted: number;
  progressPercent: number;
  xpEarned: number;
  timeSpentMin?: number;
  lastAccessedAt?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
  lesson?: LessonItem;
}

export interface ConversationItem {
  id: string;
  otherUser: BasicUser;
  lastMessage: MessageItem | null;
  lastMessageAt: string | null;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
}

export interface ParticipantItem {
  id: string;
  fullName: string;
  role: Role;
  profile?: { avatarUrl: string | null };
  context?: {
    students: string[];
    classes: string[];
    subjects: string[];
  };
}

export interface GuardianStudent {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth?: string | null;
  schoolId?: string | null;
  school?: { id: string; name: string } | null;
  enrollment?: {
    id: string;
    status: EnrollmentStatus;
    seatNumber?: number | null;
    class?: ClassRef | null;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type NeuroConditionCode =
  | "ADHD"
  | "ASD"
  | "DYSLEXIA"
  | "DYSCALCULIA"
  | "ANXIETY"
  | "DEPRESSION"
  | "DEFAULT";

export type NeuroTestLifecycle = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type NeuroAssignmentStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "CANCELLED";

export interface NeuroConditionCatalogItem {
  id: string;
  code: NeuroConditionCode;
  label: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NeuroTestItem {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  instructionText?: string | null;
  targetCondition: NeuroConditionCode;
  lifecycle: NeuroTestLifecycle;
  version: number;
  configJson?: unknown;
  questionSetJson?: unknown;
  scoringJson?: unknown;
  estimatedMin?: number | null;
  createdAt?: string;
  updatedAt?: string;
  condition?: NeuroConditionCatalogItem;
}

export interface NeuroUserLite {
  id: string;
  fullName: string;
  email?: string;
}

export interface NeuroTestAttemptItem {
  id: string;
  assignmentId: string;
  testId: string;
  studentId: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSec?: number | null;
  answersJson?: unknown;
  score?: number | null;
  analysisJson?: unknown;
  inferredCondition?: NeuroConditionCode | null;
  confidence?: number | null;
  reviewedByTeacherId?: string | null;
  reviewerNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reviewedByTeacher?: NeuroUserLite | null;
}

export interface NeuroAssignmentAttemptPolicy {
  maxAttempts: number;
  lowScoreThreshold: number;
  retryCooldownDays: number;
  attemptsUsed: number;
  remainingAttempts: number;
  latestScore: number | null;
  latestSupportLevel:
    | "no_strong_concern"
    | "monitor"
    | "repeated_difficulty_indicator"
    | "support_review_recommended"
    | null;
  latestAttemptId: string | null;
  needsRetry: boolean;
  canRetryNow: boolean;
  retryAvailableAt: string | null;
  statusLabel:
    | "retry_available"
    | "retry_waiting"
    | "awaiting_score"
    | "passed"
    | "max_attempts_reached";
}

export interface NeuroAssignmentItem {
  id: string;
  testId: string;
  studentId: string;
  assignedByTeacherId: string;
  classId?: string | null;
  status: NeuroAssignmentStatus;
  visibleToStudent: boolean;
  dueAt?: string | null;
  notes?: string | null;
  assignedAt: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  test?: NeuroTestItem;
  student?: NeuroUserLite;
  assignedByTeacher?: NeuroUserLite;
  class?: ClassRef | null;
  attempts?: NeuroTestAttemptItem[];
  attemptPolicy?: NeuroAssignmentAttemptPolicy;
}

export interface TeacherNeuroAssignmentDetailResponse {
  assignment: NeuroAssignmentItem;
  analytics: {
    attemptsCount: number;
    scoredAttemptsCount: number;
    latestScore: number | null;
    bestScore: number | null;
    averageScore: number | null;
    latestSupportLevel:
      | "no_strong_concern"
      | "monitor"
      | "repeated_difficulty_indicator"
      | "support_review_recommended"
      | null;
  };
}

export interface TeacherNeuroRecommendationsResponse {
  summary: {
    totalStudentsScanned: number;
    threshold: number;
    lowEngagementStudents: number;
  };
  recommendations: Array<{
    student: NeuroUserLite & {
      age?: number | null;
    };
    class?: ClassRef | null;
    metrics: {
      averageEngagement: number;
      averageConcentration: number;
      currentStreak: number;
      dailyLessonsDone: number;
      lastActivityDate?: string | null;
    };
    riskBand: "low" | "medium" | "high";
    reason: string;
    suggestedConditions: NeuroConditionCode[];
    recommendedTests: Array<{
      id: string;
      key: string;
      title: string;
      targetCondition: NeuroConditionCode;
      estimatedMin?: number | null;
    }>;
    activeAssignmentsCount: number;
  }>;
}

export interface NeuroBulkAssignmentResponse {
  message: string;
  scanned: number;
  eligible: number;
  created: number;
  skippedExisting: number;
  filters: {
    classId?: string | null;
    minAge?: number | null;
    maxAge?: number | null;
    lowEngagementOnly: boolean;
    engagementThreshold: number;
  };
  assignments: NeuroAssignmentItem[];
}

export interface StudentNeuroResultsResponse {
  summary: {
    totalAssignments: number;
    reviewedCount: number;
    averageScore: number;
  };
  assignments: NeuroAssignmentItem[];
}

export interface GuardianNeuroTestsResponse {
  tests: NeuroTestItem[];
  total: number;
  limit: number;
  filters: {
    targetCondition: NeuroConditionCode | null;
  };
}

export interface GuardianStudentNeuroAssignmentsResponse {
  studentId: string;
  scope: "active" | "history" | "all";
  total: number;
  limit: number;
  summary: {
    pendingCount: number;
    submittedCount: number;
  };
  assignments: NeuroAssignmentItem[];
}

export interface ApiErrorShape {
  message?: string;
  error?: string;
  details?: unknown;
}
