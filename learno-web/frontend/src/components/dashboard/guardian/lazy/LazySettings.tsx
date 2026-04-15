'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianSettings = dynamic(
  () => import('../SettingsPage').then((module) => module.SettingsPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Settings" />,
  },
);

export function LazyGuardianSettings() {
  return <GuardianSettings />;
}