import { LazyAdminClassesPage } from '@/components/dashboard/admin/lazy/LazyAdminClassesPage';

export const metadata = {
  title: 'Classes - Learno Admin',
};

export default function AdminClassesRoute() {
  return <LazyAdminClassesPage />;
}
