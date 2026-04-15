import { StudentProfilePage } from '@/components/dashboard/admin/pages/StudentProfilePage';

export const metadata = {
  title: 'Student Profile - Learno Admin',
};

export default async function AdminStudentProfileRoute({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentProfilePage studentId={studentId} />;
}
