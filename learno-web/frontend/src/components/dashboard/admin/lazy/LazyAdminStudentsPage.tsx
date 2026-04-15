'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentsPage = dynamic(
  () => import('../pages/StudentsPage').then((module) => module.StudentsPage),
  {
    loading: () => <LazyPageFallback title="Students" />,
  },
);

export function LazyAdminStudentsPage() {
  return <StudentsPage />;
}

