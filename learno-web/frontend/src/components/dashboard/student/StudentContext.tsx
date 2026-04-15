'use client';

import { createContext, useContext } from 'react';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';

type StudentDashboardContextValue = ReturnType<typeof useStudentDashboard>;

const StudentDashboardContext = createContext<StudentDashboardContextValue | null>(null);

export function StudentDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useStudentDashboard();
  return (
    <StudentDashboardContext.Provider value={value}>
      {children}
    </StudentDashboardContext.Provider>
  );
}

export function useStudentDashboardContext() {
  const context = useContext(StudentDashboardContext);

  if (!context) {
    throw new Error(
      'useStudentDashboardContext must be used within StudentDashboardProvider.',
    );
  }

  return context;
}
