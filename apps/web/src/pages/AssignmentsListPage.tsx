import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { AssignmentCard } from '../components/AssignmentCard';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Assignment {
  id: string;
  techniqueId: string;
  techniqueTitle: string;
  status: 'pending' | 'completed';
  assignedAt: string;
  therapistNotes?: string;
}

export function AssignmentsListPage() {
  const token = useAuthStore((s) => s.token);

  const { data: assignments, isLoading, error } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar asignaciones');
      const data = await res.json();
      return data.map((a: any) => ({
        ...a,
        techniqueTitle: a.technique?.title ?? a.techniqueTitle,
      }));
    },
  });

  return (
    <main>
      <h1>Mis asignaciones</h1>
      {isLoading && <p>Cargando asignaciones…</p>}
      {error && <p role="alert" style={{ color: 'red' }}>Error al cargar asignaciones</p>}
      {assignments && assignments.length === 0 && (
        <p>No tienes asignaciones todavía.</p>
      )}
      {assignments && assignments.map((a) => (
        <AssignmentCard
          key={a.id}
          id={a.id}
          techniqueTitle={a.techniqueTitle}
          status={a.status}
          assignedAt={a.assignedAt}
          therapistNotes={a.therapistNotes}
        />
      ))}
    </main>
  );
}
