import { LazyAdminTeachersPage } from '@/components/dashboard/admin/lazy/LazyAdminTeachersPage';

export const metadata = {
  title: 'Teachers - Learno Admin',
};

export default function AdminTeachersRoute() {
  return <LazyAdminTeachersPage />;
}

