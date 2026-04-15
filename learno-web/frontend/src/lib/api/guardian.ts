import { apiRequest } from "@/lib/api/http";
import type {
  GuardianNeuroTestsResponse,
  GuardianStudent,
  GuardianStudentNeuroAssignmentsResponse,
  NeuroAssignmentItem,
} from "@/lib/api/types";

export interface GuardianCreateStudentInput {
  fullName: string;
  email: string;
  dateOfBirth?: string;
  age?: number;
  schoolId: string;
  classId: string;
}

export interface GuardianUpdateStudentInput {
  fullName?: string;
  dateOfBirth?: string;
  age?: number;
}

export interface GuardianAssignNeuroTestInput {
  testId: string;
  studentId: string;
  visibleToStudent?: boolean;
  dueAt?: string | null;
  notes?: string | null;
}

export const guardianApi = {
  getSchools() {
    return apiRequest<{
      schools: Array<{ id: string; name: string }>;
      total: number;
    }>("/guardian/schools");
  },

  getSchoolClasses(schoolId: string) {
    return apiRequest<{
      school: { id: string; name: string };
      classes: Array<{ id: string; name: string }>;
      total: number;
    }>(`/guardian/schools/${schoolId}/classes`);
  },

  createStudent(input: GuardianCreateStudentInput) {
    return apiRequest<{
      message: string;
      student: {
        id: string;
        fullName: string;
        email: string;
        dateOfBirth: string;
      };
      enrollment: {
        id: string;
        classId: string;
        className: string;
        schoolId: string;
        schoolName: string;
        status: string;
      };
      generatedPassword: string;
    }>("/guardian/students", {
      method: "POST",
      body: input,
    });
  },

  updateStudent(studentId: string, input: GuardianUpdateStudentInput) {
    return apiRequest<{
      message: string;
      student: GuardianStudent;
    }>(`/guardian/students/${studentId}`, {
      method: "PATCH",
      body: input,
    });
  },

  getStudents() {
    return apiRequest<{ students: GuardianStudent[]; total: number }>("/guardian/students");
  },

  getStudentDetail(studentId: string) {
    return apiRequest<{ student: GuardianStudent & { createdAt?: string; profile?: { avatarUrl: string | null } | null } }>(
      `/guardian/students/${studentId}`,
    );
  },

  getStudentProgress(studentId: string) {
    return apiRequest<{
      xp: {
        totalXP?: number;
        currentLevel?: number;
        level?: number;
        currentStreak?: number;
        longestStreak?: number;
      };
      recentLessons: Array<{
        id: string;
        status?: string;
        score?: number | null;
        progressPercent?: number;
        xpEarned?: number;
        lesson: {
          id: string;
          title: string;
          subject?: { name: string } | null;
        };
      }>;
      recentAchievements: Array<{
        id: string;
        unlockedAt: string;
        achievement: {
          id: string;
          name: string;
          description: string;
          icon?: string | null;
          xpReward: number;
        };
      }>;
      classConcentration?: {
        concentrationScore: number;
        attentionScore: number;
        classEngagementScore: number;
        sessionCount: number;
        trend: "UP" | "DOWN" | "STABLE";
      } | null;
    }>(`/guardian/students/${studentId}/progress`);
  },

  getStudentThemeCondition(studentId: string) {
    return apiRequest<{
      studentId: string;
      condition: string;
      rawCondition?: string;
      source?: string;
      updatedAt?: string | null;
    }>(`/neuro/student-condition/${studentId}`);
  },

  getAssignableNeuroTests(query?: {
    limit?: number;
    targetCondition?:
      | "ADHD"
      | "ASD"
      | "DYSLEXIA"
      | "DYSCALCULIA"
      | "ANXIETY"
      | "DEPRESSION"
      | "DEFAULT";
  }) {
    return apiRequest<GuardianNeuroTestsResponse>("/guardian/neuro/tests", {
      query,
    });
  },

  assignNeuroTestToChild(input: GuardianAssignNeuroTestInput) {
    return apiRequest<NeuroAssignmentItem>("/guardian/neuro/assignments", {
      method: "POST",
      body: input,
    });
  },

  getStudentNeuroAssignments(
    studentId: string,
    query?: {
      scope?: "active" | "history" | "all";
      status?: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
      limit?: number;
    },
  ) {
    return apiRequest<GuardianStudentNeuroAssignmentsResponse>(
      `/guardian/students/${studentId}/neuro-assignments`,
      {
        query,
      },
    );
  },
};
