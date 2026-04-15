import { LazyGuardianNotifications } from '@/components/dashboard/guardian/lazy/LazyNotifications';

export const metadata = {
  title: 'Notifications - Learno Guardian',
};

export default function GuardianNotificationsPage() {
  return <LazyGuardianNotifications />;
}
