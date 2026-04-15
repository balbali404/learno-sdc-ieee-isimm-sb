'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianMessages = dynamic(
  () => import('../Messages').then((module) => module.Messages),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Messages" />,
  },
);

export function LazyGuardianMessages() {
  return <GuardianMessages />;
}