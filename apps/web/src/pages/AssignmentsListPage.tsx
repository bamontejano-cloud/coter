import { useQuery } from '@tanstack/react-query';
import { AssignmentCard } from '../components/AssignmentCard';
import { api } from '../lib/apiClient';
import type { Assignment } from '@coterapeuta/shared';

export function AssignmentsListPage() {
  const { data: assignments, isLoading, error } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: () => api.get<Assignment[]>('/assignments'),
  });

  return (
    <main>
      <h1>Mis asignaciones</h1>
      {isLoading && <p>Cargando asignaciones…</p>}
      {error && <p role="alert" style={{ color: 'red' }}>Error al cargar asignaciones</p>}
      {assignments && assignments.length === 0 && (
        <p>No tienes asignaciones todavía.</p>
      )}
      {assignments && assignments.length > 0 && (
        <ul aria-label="Lista de asignaciones" style={{ listStyle: 'none', padding: 0 }}>
          {assignments.map((a) => (
            <li key={a.id}>
              <AssignmentCard
                assignment={{
                  id: a.id,
                  techniqueId: a.techniqueId,
                  techniqueTitle: a.technique?.title ?? '',
                  status: a.status,
                  assignedAt: a.assignedAt,
                  therapistNotes: a.therapistNotes ?? null,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
