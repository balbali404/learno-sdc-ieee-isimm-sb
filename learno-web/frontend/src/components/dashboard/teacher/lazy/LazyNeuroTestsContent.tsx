'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const NeuroTestsContent = dynamic(
  () => import('../NeuroTestsContent').then((module) => module.NeuroTestsContent),
  {
    loading: () => <LazyPageFallback title="Neuro Tests" />,
  },
);

export function LazyNeuroTestsContent() {
  return <NeuroTestsContent />;
}
