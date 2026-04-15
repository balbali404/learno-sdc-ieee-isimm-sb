import { Inter } from 'next/font/google';
import { RoleProtected } from '@/components/auth/RoleProtected';
import { AdminShell } from '@/components/dashboard/admin/AdminShell';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Admin Dashboard - Learno',
  description:
    'Learno School Administrator Portal - monitor students, teachers, alerts, and analytics.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtected allowedRoles={['SCHOOL_ADMIN', 'SUPER_ADMIN']}>
      <div className={inter.className}>
        <AdminShell>{children}</AdminShell>
      </div>
    </RoleProtected>
  );
}

