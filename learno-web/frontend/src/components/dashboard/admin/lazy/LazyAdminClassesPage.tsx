'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const ClassesPage = dynamic(
  () => import('../pages/ClassesPage').then((module) => module.ClassesPage),
  {
    loading: () => <LazyPageFallback title="Classes" />,
  },
);

export function LazyAdminClassesPage() {
  return <ClassesPage />;
}
