'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentsContent = dynamic(
  () => import('../StudentsContent').then((module) => module.StudentsContent),
  {
    loading: () => <LazyPageFallback title="Students" />,
  },
);

export function LazyStudentsContent() {
  return <StudentsContent />;
}
