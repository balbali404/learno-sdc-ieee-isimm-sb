import { apiRequest } from "@/lib/api/http";
import type {
  NeuroAssignmentItem,
  NeuroBulkAssignmentResponse,
  NeuroConditionCatalogItem,
  NeuroConditionCode,
  NeuroTestAttemptItem,
  NeuroTestItem,
  StudentNeuroResultsResponse,
  TeacherNeuroAssignmentDetailResponse,
  TeacherNeuroRecommendationsResponse,
} from "@/lib/api/types";

export interface AssignNeuroTestInput {
  testId: string;
  studentId: string;
  classId?: string | null;
  visibleToStudent?: boolean;
  dueAt?: string | null;
  notes?: string | null;
}

export interface AssignNeuroTestByCriteriaInput {
  testId: string;
  classId?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  lowEngagementOnly?: boolean;
  engagementThreshold?: number | null;
  maxStudents?: number | null;
  visibleToStudent?: boolean;
  dueAt?: string | null;
  notes?: string | null;
}

export interface UpdateNeuroAssignmentInput {
  visibleToStudent?: boolean;
  status?: "ASSIGNED" | "CANCELLED";
  dueAt?: string | null;
  notes?: string | null;
}

export interface SubmitNeuroAttemptInput {
  answersJson?: unknown;
  score?: number | null;
  analysisJson?: unknown;
  inferredCondition?: NeuroConditionCode | null;
  confidence?: number | null;
  durationSec?: number | null;
}

export interface ReviewNeuroAttemptInput {
  reviewerNotes?: string | null;
  overrideCondition?: NeuroConditionCode | null;
  confidence?: number | null;
}

export interface TeacherAssignmentsQuery
  extends Record<string, string | number | boolean | undefined | null> {
  status?: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
  testId?: string;
  studentId?: string;
}

export interface StudentAssignmentsQuery
  extends Record<string, string | number | boolean | undefined | null> {
  scope?: "active" | "history" | "all";
  limit?: number;
}

export interface TeacherRecommendationQuery
  extends Record<string, string | number | boolean | undefined | null> {
  classId?: string;
  limit?: number;
  engagementThreshold?: number;
  includeAssigned?: boolean;
}

export const neuroApi = {
  listTests(query?: { bootstrapDefaults?: boolean }) {
    return apiRequest<NeuroTestItem[]>("/neuro/tests", {
      query,
    });
  },

  bootstrapDefaultTests() {
    return apiRequest<{ message: string; created: number; updated: number; total: number }>(
      "/neuro/tests/bootstrap-defaults",
      {
        method: "POST",
      },
    );
  },

  getConditionCatalog() {
    return apiRequest<NeuroConditionCatalogItem[]>("/neuro/conditions");
  },

  assignToStudent(input: AssignNeuroTestInput) {
    return apiRequest<NeuroAssignmentItem>("/neuro/assignments", {
      method: "POST",
      body: input,
    });
  },

  assignByCriteria(input: AssignNeuroTestByCriteriaInput) {
    return apiRequest<NeuroBulkAssignmentResponse>("/neuro/assignments/bulk", {
      method: "POST",
      body: input,
    });
  },

  getTeacherAssignments(query?: TeacherAssignmentsQuery) {
    return apiRequest<NeuroAssignmentItem[]>("/neuro/assignments/teacher", {
      query,
    });
  },

  getTeacherAssignmentDetail(assignmentId: string) {
    return apiRequest<TeacherNeuroAssignmentDetailResponse>(
      `/neuro/assignments/${assignmentId}/teacher`,
    );
  },

  getTeacherRecommendations(query?: TeacherRecommendationQuery) {
    return apiRequest<TeacherNeuroRecommendationsResponse>(
      "/neuro/assignments/teacher/recommendations",
      {
        query,
      },
    );
  },

  updateAssignment(assignmentId: string, input: UpdateNeuroAssignmentInput) {
    return apiRequest<NeuroAssignmentItem>(`/neuro/assignments/${assignmentId}`, {
      method: "PATCH",
      body: input,
    });
  },

  reviewAttempt(attemptId: string, input: ReviewNeuroAttemptInput) {
    return apiRequest<{
      attempt: NeuroTestAttemptItem;
      assignment: NeuroAssignmentItem;
      profile: unknown;
    }>(`/neuro/attempts/${attemptId}/review`, {
      method: "PATCH",
      body: input,
    });
  },

  getMyAssignments(query?: StudentAssignmentsQuery) {
    return apiRequest<NeuroAssignmentItem[]>("/neuro/assignments/me", {
      query,
    });
  },

  getMyResults(query?: { limit?: number }) {
    return apiRequest<StudentNeuroResultsResponse>("/neuro/assignments/me/results", {
      query,
    });
  },

  getMyAssignmentDetail(assignmentId: string) {
    return apiRequest<NeuroAssignmentItem>(`/neuro/assignments/${assignmentId}/me`);
  },

  startMyAssignment(assignmentId: string) {
    return apiRequest<NeuroAssignmentItem>(`/neuro/assignments/${assignmentId}/start`, {
      method: "PATCH",
    });
  },

  submitMyAssignment(assignmentId: string, input: SubmitNeuroAttemptInput) {
    return apiRequest<{
      attempt: NeuroTestAttemptItem;
      profile: unknown;
      attemptPolicy?: Record<string, unknown>;
    }>(`/neuro/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: input,
    });
  },

  getStudentCondition(studentId?: string) {
    const endpoint = studentId ? `/neuro/student-condition/${studentId}` : "/neuro/student-condition";
    return apiRequest<{
      studentId: string;
      condition: string;
      rawCondition?: NeuroConditionCode;
      confidence?: number | null;
      sourceAssignmentId?: string | null;
      sourceAttemptId?: string | null;
      updatedAt?: string | null;
    }>(endpoint);
  },

  getStudentConditionHistory(studentId: string) {
    return apiRequest<Array<Record<string, unknown>>>(`/neuro/students/${studentId}/condition-history`);
  },
};
