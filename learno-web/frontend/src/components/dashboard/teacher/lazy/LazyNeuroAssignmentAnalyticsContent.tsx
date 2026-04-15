'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const NeuroAssignmentAnalyticsContent = dynamic(
  () =>
    import('../NeuroAssignmentAnalyticsContent').then(
      (module) => module.NeuroAssignmentAnalyticsContent,
    ),
  {
    loading: () => <LazyPageFallback title="Neuro Assignment Analytics" />,
  },
);

export function LazyNeuroAssignmentAnalyticsContent() {
  return <NeuroAssignmentAnalyticsContent />;
}
