'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const SettingsPage = dynamic(
  () => import('../pages/SettingsPage').then((module) => module.SettingsPage),
  {
    loading: () => <LazyPageFallback title="Settings" />,
  },
);

export function LazyAdminSettingsPage() {
  return <SettingsPage />;
}

