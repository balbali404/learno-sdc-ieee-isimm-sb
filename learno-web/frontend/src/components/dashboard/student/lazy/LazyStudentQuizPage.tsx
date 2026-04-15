'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const StudentQuizPage = dynamic(
  () => import('../pages/QuizPage').then((module) => module.QuizPage),
  {
    ssr: true,
    loading: () => <LazyPageFallback title="Quizzes" />,
  },
);

export function LazyStudentQuizPage() {
  return <StudentQuizPage />;
}