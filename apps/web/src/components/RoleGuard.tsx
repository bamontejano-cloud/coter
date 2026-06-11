import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  roles: ('therapist' | 'patient')[];
  children: ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}
