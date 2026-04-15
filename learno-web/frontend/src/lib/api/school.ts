import { apiRequest } from "@/lib/api/http";
import type { ClassRef, EnrollmentStatus, SubjectRef, TimetableEntry } from "@/lib/api/types";

interface CreateUserInput {
  fullName: string;
  email: string;
}

interface CreateClassInput {
  name: string;
}

interface CreateSubjectInput {
  name: string;
}

interface CreateTimetableInput {
  teacherId: string;
  classId: string;
  subjectId: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface EnrollmentActionInput {
  enrollmentId: string;
  action: "APPROVED" | "REJECTED";
  seatNumber?: number;
}

export const schoolApi = {
  createCoAdmin(input: CreateUserInput) {
    return apiRequest<{ message: string; admin: { id: string; fullName: string; email: string; role: string; createdAt: string }; generatedPassword: string }>(
      "/school/co-admins",
      { method: "POST", body: input },
    );
  },

  createTeacher(input: CreateUserInput) {
    return apiRequest<{ message: string; teacher: { id: string; fullName: string; email: string; role: string; createdAt: string }; generatedPassword: string }>(
      "/school/teachers",
      { method: "POST", body: input },
    );
  },

  getTeachers() {
    return apiRequest<{
      teachers: Array<{
        id: string;
        fullName: string;
        email: string;
        role: string;
        createdAt: string;
        profile?: { avatarUrl: string | null; phone: string | null } | null;
      }>;
      total: number;
    }>("/school/teachers");
  },

  removeTeacher(id: string) {
    return apiRequest<{ message: string }>(`/school/teachers/${id}`, {
      method: "DELETE",
    });
  },

  getPendingEnrollments() {
    return apiRequest<{
      enrollments: Array<{
        id: string;
        status: EnrollmentStatus;
        enrolledAt: string;
        seatNumber?: number | null;
        student: { id: string; fullName: string; email: string; dateOfBirth?: string | null };
        class: ClassRef;
      }>;
      total: number;
    }>("/school/enrollments/pending");
  },

  handleEnrollment(input: EnrollmentActionInput) {
    return apiRequest<{ message: string; enrollment?: unknown }>("/school/enrollments/handle", {
      method: "POST",
      body: input,
    });
  },

  getStudents() {
    return apiRequest<{
      students: Array<{
        id: string;
        fullName: string;
        email: string;
        role: string;
        dateOfBirth?: string | null;
        createdAt: string;
        enrollment?: {
          status: EnrollmentStatus;
          seatNumber?: number | null;
          class?: ClassRef | null;
        } | null;
      }>;
      total: number;
    }>("/school/students");
  },

  removeStudent(id: string) {
    return apiRequest<{ message: string }>(`/school/students/${id}`, {
      method: "DELETE",
    });
  },

  createClass(input: CreateClassInput) {
    return apiRequest<{ message: string; class: { id: string; schoolId: string; name: string; createdAt: string } }>(
      "/school/classes",
      { method: "POST", body: input },
    );
  },

  getClasses() {
    return apiRequest<{
      classes: Array<
        ClassRef & {
          schoolId: string;
          createdAt: string;
          _count?: { students: number };
        }
      >;
      total: number;
    }>("/school/classes");
  },

  deleteClass(id: string) {
    return apiRequest<{ message: string }>(`/school/classes/${id}`, {
      method: "DELETE",
    });
  },

  createSubject(input: CreateSubjectInput) {
    return apiRequest<{ message: string; subject: SubjectRef & { schoolId: string } }>(
      "/school/subjects",
      { method: "POST", body: input },
    );
  },

  getSubjects() {
    return apiRequest<{ subjects: Array<SubjectRef & { schoolId: string }>; total: number }>(
      "/school/subjects",
    );
  },

  deleteSubject(id: string) {
    return apiRequest<{ message: string }>(`/school/subjects/${id}`, {
      method: "DELETE",
    });
  },

  createTimetable(input: CreateTimetableInput) {
    return apiRequest<{ message: string; timetable: TimetableEntry }>("/school/timetable", {
      method: "POST",
      body: input,
    });
  },

  getTimetable() {
    return apiRequest<{ timetable: TimetableEntry[]; total: number }>("/school/timetable");
  },

  deleteTimetable(id: string) {
    return apiRequest<{ message: string }>(`/school/timetable/${id}`, {
      method: "DELETE",
    });
  },
};
