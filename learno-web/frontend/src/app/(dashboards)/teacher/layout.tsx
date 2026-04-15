import { TeacherShell } from '@/components/dashboard/teacher/TeacherShell';
import { RoleProtected } from '@/components/auth/RoleProtected';

export const metadata = {
  title: 'Teacher Dashboard – Learno',
  description: 'Learno Teacher Portal – Monitor student engagement, session analytics, and classroom environment.',
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtected allowedRoles={['TEACHER']}>
      <TeacherShell>{children}</TeacherShell>
    </RoleProtected>
  );
}
