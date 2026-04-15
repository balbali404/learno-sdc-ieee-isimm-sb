'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const ReportsContent = dynamic(
  () => import('../ReportsContent').then((module) => module.ReportsContent),
  {
    loading: () => <LazyPageFallback title="Reports" />,
  },
);

export function LazyReportsContent() {
  return <ReportsContent />;
}
