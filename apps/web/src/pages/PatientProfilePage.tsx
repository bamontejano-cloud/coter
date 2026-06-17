import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { PatientProfile } from '@coterapeuta/shared';

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading, error } = useQuery<PatientProfile>({
    queryKey: ['patient', id],
    queryFn: () => api.get<PatientProfile>(`/patients/${id}`),
    enabled: !!id,
  });

  if (isLoading) return <p>Cargando perfil…</p>;
  if (error) return <p role="alert" style={{ color: 'red' }}>Error al cargar perfil del paciente</p>;
  if (!profile) return null;

  return (
    <main>
      <Link to="/patients">← Volver a la lista</Link>
      <h1>{profile.fullName}</h1>
      <p>Email: {profile.email}</p>
      <p>Vinculado: {new Date(profile.linkedAt).toLocaleDateString('es-ES')}</p>
      <p>
        Mensajes no leídos:{' '}
        <strong>{profile.messagesSummary.unreadCount}</strong>
      </p>

      <section>
        <h2>Asignaciones</h2>
        {profile.assignments.length === 0 ? (
          <p>Sin asignaciones todavía.</p>
        ) : (
          <ul aria-label="Historial de asignaciones del paciente">
            {profile.assignments.map((a) => (
              <li key={a.id}>
                <strong>{a.techniqueTitle}</strong>
                {' — '}
                <span
                  aria-label={`Estado: ${a.status === 'pending' ? 'pendiente' : 'completada'}`}
                  style={{ color: a.status === 'completed' ? 'green' : 'orange' }}
                >
                  {a.status === 'pending' ? 'Pendiente' : 'Completada'}
                </span>
                {' — Asignada: '}
                {new Date(a.assignedAt).toLocaleDateString('es-ES')}
                {a.therapistNotes && (
                  <p>
                    <em>Notas: {a.therapistNotes}</em>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
