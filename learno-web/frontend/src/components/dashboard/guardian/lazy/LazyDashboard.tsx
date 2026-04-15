'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianDashboard = dynamic(
  () => import('../Dashboard').then((module) => module.Dashboard),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Guardian Dashboard" />,
  },
);

export function LazyGuardianDashboard() {
  return <GuardianDashboard />;
}