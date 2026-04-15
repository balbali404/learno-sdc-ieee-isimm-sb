'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianProgress = dynamic(
  () => import('../Progress').then((module) => module.Progress),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Progress" />,
  },
);

export function LazyGuardianProgress() {
  return <GuardianProgress />;
}