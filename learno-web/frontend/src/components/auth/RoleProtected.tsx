'use client';

import type { ReactNode } from 'react';
import type { Role } from '@/lib/api/types';
import { useRoleGuard } from '@/hooks/useRoleGuard';

interface RoleProtectedProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function RoleProtected({ allowedRoles, children }: RoleProtectedProps) {
  const { isReady, isAuthorized } = useRoleGuard(allowedRoles);

  if (!isReady || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
