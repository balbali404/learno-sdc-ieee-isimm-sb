'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianNotifications = dynamic(
  () => import('../Notifications').then((module) => module.Notifications),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Notifications" />,
  },
);

export function LazyGuardianNotifications() {
  return <GuardianNotifications />;
}
