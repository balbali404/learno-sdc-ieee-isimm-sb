import { LazyStudentLessonDetailPage } from '@/components/dashboard/student/lazy/LazyStudentLessonDetailPage';

export const metadata = {
  title: 'Lesson - Learno Student',
};

export default async function StudentLessonDetailRoutePage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return <LazyStudentLessonDetailPage lessonId={lessonId} />;
}
