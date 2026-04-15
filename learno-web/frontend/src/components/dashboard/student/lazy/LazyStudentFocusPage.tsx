'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentFocusPage = dynamic(
  () => import('../pages/FocusPage').then((module) => module.FocusPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Focus Mode" />,
  },
);

export function LazyStudentFocusPage() {
  return <StudentFocusPage />;
}
