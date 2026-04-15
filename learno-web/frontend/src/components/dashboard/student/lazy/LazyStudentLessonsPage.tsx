'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentLessonsPage = dynamic(
  () => import('../pages/MyLessonsPage').then((module) => module.MyLessonsPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="My Lessons" />,
  },
);

export function LazyStudentLessonsPage() {
  return <StudentLessonsPage />;
}