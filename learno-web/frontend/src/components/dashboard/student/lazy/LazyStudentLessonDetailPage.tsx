'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentLessonDetailPage = dynamic(
  () => import('../pages/MyLessonsPage').then((module) => module.MyLessonsPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Lesson" />,
  },
);

interface LazyStudentLessonDetailPageProps {
  lessonId: string;
}

export function LazyStudentLessonDetailPage({ lessonId }: LazyStudentLessonDetailPageProps) {
  return <StudentLessonDetailPage lessonId={lessonId} standalone={true} />;
}
