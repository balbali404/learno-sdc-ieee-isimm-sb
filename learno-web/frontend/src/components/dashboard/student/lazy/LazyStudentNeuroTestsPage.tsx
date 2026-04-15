'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentNeuroTestsPage = dynamic(
  () => import('../pages/NeuroTestsPage').then((module) => module.NeuroTestsPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Neuro Tests" />,
  },
);

export function LazyStudentNeuroTestsPage() {
  return <StudentNeuroTestsPage />;
}
