import { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Textarea } from '../components/ui/Textarea';
import { StatusBadge } from '../components/StatusBadge';
import { Icon } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { Assignment, RecordEntry } from '@coterapeuta/shared';

interface AssignmentWithTitle extends Assignment {
  techniqueTitle: string;
}

/**
 * Patient-side assignment detail. Shows the technique, status, therapist
 * notes, and (when status is pending) the response form. Submitting the
 * record flips the assignment to "completed" and bounces the user back to
 * the assignments list.
 */
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

  if (isLoading) {
    return (
      <div className="page-state">
        <Spinner size="lg" label="Cargando asignación…" />
        <p className="page-state__hint">Cargando asignación…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state">
        <Alert variant="danger" title="No se pudo cargar la asignación">
          Verificá tu conexión e intentá nuevamente.
        </Alert>
        <div className="page-state__actions">
          <Button variant="ghost" onClick={() => navigate('/assignments')}>
            <Icon name="ChevronLeft" size="sm" />
            Volver a asignaciones
          </Button>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const title = assignment.techniqueTitle || assignment.technique?.title || 'Asignación';

  return (
    <div className="page-stack">
      <Button
        variant="ghost"
        className="page-back-link"
        onClick={() => navigate('/assignments')}
      >
        <Icon name="ChevronLeft" size="sm" />
        Volver a asignaciones
      </Button>

      <Card
        padding="lg"
        className="assignment-detail-hero"
        aria-label={`Asignación: ${title}`}
        actions={<StatusBadge status={assignment.status} />}
      >
        <p className="assignment-detail-hero__eyebrow">
          <Icon name="ClipboardList" size="xs" /> Asignación
        </p>
        <h1 className="assignment-detail-hero__title">{title}</h1>
        <p className="assignment-detail-hero__meta">
          Asignada el{' '}
          <time dateTime={assignment.assignedAt}>
            {new Date(assignment.assignedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
      </Card>

      {assignment.therapistNotes && (
        <Card
          title={
            <span className="assignment-detail-card__title">
              <Icon name="Info" size="sm" /> Notas del terapeuta
            </span>
          }
          aria-label="Notas del terapeuta"
        >
          <p className="assignment-detail-card__notes">{assignment.therapistNotes}</p>
        </Card>
      )}

      {assignment.status === 'pending' && (
        <Card
          title={
            <span className="assignment-detail-card__title">
              <Icon name="Edit" size="sm" /> Completar tarea
            </span>
          }
          subtitle="Contale a tu terapeuta cómo te fue con esta técnica."
          aria-label="Formulario de registro"
        >
          {responseError && (
            <div className="assignment-detail-card__alert">
              <Alert variant="danger" title="No se pudo enviar el registro">
                {responseError}
              </Alert>
            </div>
          )}
          <form onSubmit={handleSubmit} className="assignment-detail-card__form">
            <Textarea
              id="response"
              label="Tu respuesta"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              required
              rows={6}
              placeholder="Cuándo la practicaste, qué notaste, qué aprendiste…"
              error={responseError ?? undefined}
            />
            <div className="assignment-detail-card__actions">
              <Button
                type="submit"
                variant="primary"
                isLoading={submitRecord.isPending}
              >
                <Icon name="Send" size="sm" />
                {submitRecord.isPending ? 'Enviando…' : 'Enviar registro'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {assignment.status === 'completed' && (
        <Card aria-label="Asignación completada">
          <div className="assignment-detail-card__completed">
            <Icon name="CheckCircle" size="lg" />
            <div>
              <p className="assignment-detail-card__completed-title">Esta asignación ya ha sido completada.</p>
              <p className="assignment-detail-card__completed-hint">
                Si querés contar algo más a tu terapeuta, podés hacerlo desde mensajes.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
