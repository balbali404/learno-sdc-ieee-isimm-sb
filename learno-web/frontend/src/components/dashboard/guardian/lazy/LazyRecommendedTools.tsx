'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const GuardianRecommendedTools = dynamic(
  () => import('../RecommendedTools').then((module) => module.RecommendedTools),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Recommended Tools" />,
  },
);

export function LazyGuardianRecommendedTools() {
  return <GuardianRecommendedTools />;
}
