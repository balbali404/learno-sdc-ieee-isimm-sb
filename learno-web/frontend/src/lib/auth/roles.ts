import type { Role } from '@/lib/api/types';

export const roleHomePath = (role: Role): string => {
  if (role === 'GUARDIAN') {
    return '/guardian';
  }

  if (role === 'STUDENT') {
    return '/student';
  }

  if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
    return '/admin';
  }

  return '/teacher';
};
