import { LazyAdminDashboardPage } from '@/components/dashboard/admin/lazy/LazyAdminDashboardPage';

export const metadata = {
  title: 'Dashboard - Learno Admin',
};

export default function AdminDashboardRoute() {
  return <LazyAdminDashboardPage />;
}

