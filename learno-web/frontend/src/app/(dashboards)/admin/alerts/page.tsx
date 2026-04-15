import { LazyAdminAlertsPage } from '@/components/dashboard/admin/lazy/LazyAdminAlertsPage';

export const metadata = {
  title: 'Alerts - Learno Admin',
};

export default function AdminAlertsRoute() {
  return <LazyAdminAlertsPage />;
}

