'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentDashboardMain = dynamic(
  () => import('../DashboardMain').then((module) => module.DashboardMain),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Student Dashboard" />,
  },
);

export function LazyStudentDashboardMain() {
  return <StudentDashboardMain />;
}