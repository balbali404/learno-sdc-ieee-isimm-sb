import { LazyAdminSessionsPage } from '@/components/dashboard/admin/lazy/LazyAdminSessionsPage';

export const metadata = {
  title: 'Sessions - Learno Admin',
};

export default function AdminSessionsRoute() {
  return <LazyAdminSessionsPage />;
}
