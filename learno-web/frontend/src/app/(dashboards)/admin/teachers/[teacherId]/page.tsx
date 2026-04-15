import { TeacherProfilePage } from '@/components/dashboard/admin/pages/TeacherProfilePage';

export const metadata = {
  title: 'Teacher Profile - Learno Admin',
};

export default async function AdminTeacherProfileRoute({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  return <TeacherProfilePage teacherId={teacherId} />;
}
