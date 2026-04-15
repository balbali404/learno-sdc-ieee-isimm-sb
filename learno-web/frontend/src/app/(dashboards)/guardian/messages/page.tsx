import { LazyGuardianMessages } from '@/components/dashboard/guardian/lazy/LazyMessages';

export const metadata = {
  title: 'Messages - Learno Guardian',
};

export default function GuardianMessagesPage() {
  return <LazyGuardianMessages />;
}