export interface StudentRow {
  id: string;
  name: string;
  email: string;
  className: string;
  grade: string;
  status: "active" | "risk" | "flagged";
  engagement: number;
  attendance: number;
  flag: string | null;
  avatar: string;
  avatarColor: string;
  avatarBg: string;
  age: number | null;
  classId: string | null;
  enrollmentStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  seatNumber: number | null;
  profile: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt: string;
}

export interface TeacherRow {
  id: string;
  name: string;
  subject: string;
  classes: number;
  students: number;
  rating: number;
  status: "active" | "away" | "inactive";
  email: string;
  phone: string | null;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  experience: string;
  lastActivity: string;
  schoolId: string | null;
  profile: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt: string;
}
