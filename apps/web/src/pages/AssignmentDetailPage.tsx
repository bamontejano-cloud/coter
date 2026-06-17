import { useState, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/apiClient';
import type { Assignment, RecordEntry } from '@coterapeuta/shared';

interface AssignmentWithTitle extends Assignment {
  techniqueTitle: string;
}

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [responseError, setResponseError] = useState<string | null>(null);

  const { data: assignment, isLoading, error } = useQuery<AssignmentWithTitle | null>({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const all = await api.get<Assignment[]>('/assignments');
      const found = all.find((a) => a.id === id);
      if (!found) return null;
      return { ...found, techniqueTitle: found.technique?.title ?? '' };
    },
    enabled: !!id,
  });

  const submitRecord = useMutation({
    mutationFn: (responseText: string) =>
      api.post<RecordEntry>('/records', { assignmentId: id, response: responseText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      navigate('/assignments');
    },
    onError: (err: Error) => {
      setResponseError(err.message);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResponseError(null);
    if (!response.trim()) {
      setResponseError('El campo de respuesta es obligatorio');
      return;
    }
    submitRecord.mutate(response);
  }

  if (isLoading) return <p>Cargando asignación…</p>;
  if (error) return <p role="alert" style={{ color: 'red' }}>Error al cargar la asignación</p>;
  if (!assignment) return null;

  return (
    <main>
      <Link to="/assignments">← Volver a asignaciones</Link>
      <h1>{assignment.techniqueTitle || assignment.technique?.title}</h1>
      <StatusBadge status={assignment.status} />
      <p>Asignada: {new Date(assignment.assignedAt).toLocaleDateString('es-ES')}</p>

      {assignment.therapistNotes && (
        <section aria-label="Notas del terapeuta">
          <h2>Notas del terapeuta</h2>
          <p>{assignment.therapistNotes}</p>
        </section>
      )}

      {assignment.status === 'pending' && (
        <section aria-label="Formulario de registro">
          <h2>Completar tarea</h2>
          <form onSubmit={handleSubmit}>
            {responseError && (
              <p role="alert" aria-live="assertive" style={{ color: 'red' }}>{responseError}</p>
            )}
            <div>
              <label htmlFor="response">Tu respuesta</label>
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                required
                rows={5}
                aria-describedby={responseError ? 'response-error' : undefined}
              />
            </div>
            <button type="submit" disabled={submitRecord.isPending}>
              {submitRecord.isPending ? 'Enviando…' : 'Enviar registro'}
            </button>
          </form>
        </section>
      )}

      {assignment.status === 'completed' && (
        <p aria-live="polite"><em>Esta asignación ya ha sido completada.</em></p>
      )}
    </main>
  );
}
