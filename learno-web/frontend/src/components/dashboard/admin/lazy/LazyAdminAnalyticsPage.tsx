'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const AnalyticsPage = dynamic(
  () => import('../pages/AnalyticsPage').then((module) => module.AnalyticsPage),
  {
    loading: () => <LazyPageFallback title="Analytics" />,
  },
);

export function LazyAdminAnalyticsPage() {
  return <AnalyticsPage />;
}

