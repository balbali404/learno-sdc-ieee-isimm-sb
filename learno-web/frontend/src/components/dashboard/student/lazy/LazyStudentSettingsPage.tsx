'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentSettingsPage = dynamic(
  () => import('../pages/SettingsPage').then((module) => module.SettingsPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Settings" />,
  },
);

export function LazyStudentSettingsPage() {
  return <StudentSettingsPage />;
}
