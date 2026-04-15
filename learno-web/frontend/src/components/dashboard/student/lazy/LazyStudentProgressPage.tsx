'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentProgressPage = dynamic(
  () => import('../pages/ProgressPage').then((module) => module.ProgressPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Progress" />,
  },
);

export function LazyStudentProgressPage() {
  return <StudentProgressPage />;
}
