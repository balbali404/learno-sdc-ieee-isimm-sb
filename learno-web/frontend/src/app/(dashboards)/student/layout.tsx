import { RoleProtected } from '@/components/auth/RoleProtected';
import { DashboardLayout } from '@/components/dashboard/student/DashboardLayout';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'Student Dashboard - Learno',
  description:
    'Learno Student Portal - track lessons, progress, focus, and quizzes.',
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtected allowedRoles={['STUDENT']}>
      <ThemeProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ThemeProvider>
    </RoleProtected>
  );
}
