'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const DashboardOverview = dynamic(
  () =>
    import('../DashboardOverview').then((module) => module.DashboardOverview),
  {
    loading: () => <LazyPageFallback title="Dashboard" />,
  },
);

export function LazyDashboardOverview() {
  return <DashboardOverview />;
}
