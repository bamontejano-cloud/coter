import { useState, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { StatusBadge } from '../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface AssignmentDetail {
  id: string;
  techniqueId: string;
  techniqueTitle: string;
  status: 'pending' | 'completed';
  assignedAt: string;
  therapistNotes?: string;
  technique?: {
    title: string;
    description: string;
    patientInstructions?: string;
  };
}

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [responseError, setResponseError] = useState<string | null>(null);

  const { data: assignment, isLoading, error } = useQuery<AssignmentDetail>({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar asignaciones');
      const all = await res.json();
      const found = all.find((a: any) => a.id === id);
      if (!found) throw new Error('Asignación no encontrada');
      return {
        ...found,
        techniqueTitle: found.technique?.title ?? found.techniqueTitle,
      };
    },
    enabled: !!id,
  });

  const submitRecord = useMutation({
    mutationFn: async (responseText: string) => {
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: id, response: responseText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Error al enviar el registro');
      }
      return res.json();
    },
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
      <h1>{assignment.techniqueTitle ?? assignment.technique?.title}</h1>
      <StatusBadge status={assignment.status} />
      <p>Asignada: {new Date(assignment.assignedAt).toLocaleDateString('es-ES')}</p>

      {assignment.therapistNotes && (
        <section aria-label="Notas del terapeuta">
          <h2>Notas del terapeuta</h2>
          <p>{assignment.therapistNotes}</p>
        </section>
      )}

      {assignment.technique?.description && (
        <section aria-label="Descripción de la técnica">
          <h2>Descripción</h2>
          <p>{assignment.technique.description}</p>
        </section>
      )}

      {assignment.technique?.patientInstructions && (
        <section aria-label="Instrucciones">
          <h2>Instrucciones</h2>
          <p>{assignment.technique.patientInstructions}</p>
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
