'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const ReportsPage = dynamic(
  () => import('../pages/ReportsPage').then((module) => module.ReportsPage),
  {
    loading: () => <LazyPageFallback title="Reports" />,
  },
);

export function LazyAdminReportsPage() {
  return <ReportsPage />;
}

