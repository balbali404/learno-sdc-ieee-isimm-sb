'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const AlertsContent = dynamic(
  () => import('../AlertsContent').then((module) => module.AlertsContent),
  {
    loading: () => <LazyPageFallback title="Alerts" />,
  },
);

export function LazyAlertsContent() {
  return <AlertsContent />;
}
