'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const SessionAnalyticsContent = dynamic(
  () =>
    import('../SessionAnalyticsContent').then(
      (module) => module.SessionAnalyticsContent,
    ),
  {
    loading: () => <LazyPageFallback title="Session Analytics" />,
  },
);

export function LazySessionAnalyticsContent() {
  return <SessionAnalyticsContent />;
}
