"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStoredAuth } from "@/hooks/useStoredAuth";
import type { Role } from "@/lib/api/types";
import { roleHomePath } from "@/lib/auth/roles";

interface UseRoleGuardResult {
  isReady: boolean;
  isAuthorized: boolean;
  userRole: Role | null;
}

export function useRoleGuard(allowedRoles: Role[]): UseRoleGuardResult {
  const router = useRouter();
  const { token, user, isHydrated } = useStoredAuth();

  const allowed = useMemo(() => new Set<Role>(allowedRoles), [allowedRoles]);

  const userRole = user?.role ?? null;
  const isReady = isHydrated;
  const isAuthorized = Boolean(token && user && allowed.has(user.role));

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (!allowed.has(user.role)) {
      router.replace(roleHomePath(user.role));
    }
  }, [allowed, isHydrated, router, token, user]);

  return {
    isReady,
    isAuthorized,
    userRole,
  };
}
