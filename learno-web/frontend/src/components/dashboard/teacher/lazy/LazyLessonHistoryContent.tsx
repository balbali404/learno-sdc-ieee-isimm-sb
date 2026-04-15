'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const LessonHistoryContent = dynamic(
  () =>
    import('../LessonHistoryContent').then(
      (module) => module.LessonHistoryContent,
    ),
  {
    loading: () => <LazyPageFallback title="Lesson History" />,
  },
);

export function LazyLessonHistoryContent() {
  return <LessonHistoryContent />;
}
