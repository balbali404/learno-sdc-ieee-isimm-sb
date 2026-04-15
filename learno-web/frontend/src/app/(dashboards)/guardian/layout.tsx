import { GuardianShell } from '@/components/dashboard/guardian/GuardianShell';
import { RoleProtected } from '@/components/auth/RoleProtected';

export const metadata = {
  title: 'Guardian Dashboard - Learno',
  description:
    'Learno Guardian Portal - track child engagement, progress, and teacher communication.',
};

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProtected allowedRoles={['GUARDIAN']}>
      <GuardianShell>{children}</GuardianShell>
    </RoleProtected>
  );
}
