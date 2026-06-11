import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Notification {
  id: string;
  type: string;
  patientId: string;
  assignmentId: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { token, user } = useAuthStore();
  const setCount = useNotificationStore((s) => s.setCount);

  const query = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar notificaciones');
      return res.json();
    },
    enabled: !!token && user?.role === 'therapist',
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
