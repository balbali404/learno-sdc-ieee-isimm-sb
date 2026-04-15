'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const AlertsPage = dynamic(
  () => import('../pages/AlertsPage').then((module) => module.AlertsPage),
  {
    loading: () => <LazyPageFallback title="Alerts" />,
  },
);

export function LazyAdminAlertsPage() {
  return <AlertsPage />;
}

