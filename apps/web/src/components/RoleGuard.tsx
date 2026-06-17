import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import type { Role } from '@coterapeuta/shared';

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}
