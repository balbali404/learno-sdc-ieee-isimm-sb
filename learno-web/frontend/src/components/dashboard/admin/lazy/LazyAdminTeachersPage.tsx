'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const TeachersPage = dynamic(
  () => import('../pages/TeachersPage').then((module) => module.TeachersPage),
  {
    loading: () => <LazyPageFallback title="Teachers" />,
  },
);

export function LazyAdminTeachersPage() {
  return <TeachersPage />;
}

