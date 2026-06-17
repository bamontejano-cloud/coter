import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { api } from '../lib/apiClient';
import type { Notification } from '@coterapeuta/shared';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const setCount = useNotificationStore((s) => s.setCount);

  const query = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
    enabled: !!user && user.role === 'therapist',
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      const unread = query.data.filter((n) => !n.read).length;
      setCount(unread);
    }
  }, [query.data, setCount]);

  return query;
}
