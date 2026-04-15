'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const MyClassesContent = dynamic(
  () => import('../MyClassesContent').then((module) => module.MyClassesContent),
  {
    loading: () => <LazyPageFallback title="My Classes" />,
  },
);

export function LazyMyClassesContent() {
  return <MyClassesContent />;
}
