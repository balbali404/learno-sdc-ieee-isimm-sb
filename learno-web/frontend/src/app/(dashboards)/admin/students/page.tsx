import { LazyAdminStudentsPage } from '@/components/dashboard/admin/lazy/LazyAdminStudentsPage';

export const metadata = {
  title: 'Students - Learno Admin',
};

export default function AdminStudentsRoute() {
  return <LazyAdminStudentsPage />;
}

