'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const DashboardPage = dynamic(
  () => import('../DashboardPage').then((module) => module.DashboardPage),
  {
    loading: () => <LazyPageFallback title="Dashboard" />,
  },
);

export function LazyAdminDashboardPage() {
  return <DashboardPage />;
}

