import { LazyAdminSettingsPage } from '@/components/dashboard/admin/lazy/LazyAdminSettingsPage';

export const metadata = {
  title: 'Settings - Learno Admin',
};

export default function AdminSettingsRoute() {
  return <LazyAdminSettingsPage />;
}

