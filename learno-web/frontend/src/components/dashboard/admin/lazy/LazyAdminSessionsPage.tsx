'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const SessionsPage = dynamic(
  () => import('../pages/SessionsPage').then((module) => module.SessionsPage),
  {
    loading: () => <LazyPageFallback title="Sessions" />,
  },
);

export function LazyAdminSessionsPage() {
  return <SessionsPage />;
}
