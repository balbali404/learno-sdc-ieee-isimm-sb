'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianChildren = dynamic(
  () => import('../MyChildren').then((module) => module.MyChildren),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="My Children" />,
  },
);

export function LazyGuardianChildren() {
  return <GuardianChildren />;
}