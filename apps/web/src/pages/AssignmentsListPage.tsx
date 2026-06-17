import { useQuery } from '@tanstack/react-query';
import { AssignmentCard } from '../components/AssignmentCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { Assignment } from '@coterapeuta/shared';

/**
 * Patient-side "Mis asignaciones" view. Lists every technique the patient's
 * therapist has assigned, each clickable to its detail page where the
 * patient can submit the record that completes it.
 */
export function AssignmentsListPage() {
  const { data: assignments, isLoading, error } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: () => api.get<Assignment[]>('/assignments'),
  });

  return (
    <div className="page-stack">
      <Card
        padding="lg"
        className="assignments-list-header"
        aria-label="Mis asignaciones"
      >
        <p className="assignments-list-header__eyebrow">
          <Icon name="ClipboardList" size="xs" /> Asignaciones
        </p>
        <h1 className="assignments-list-header__title">Mis asignaciones</h1>
        <p className="assignments-list-header__subtitle">
          Cada técnica que tu terapeuta te asigne aparece acá. Cuando terminés
          una, completá el registro desde su detalle.
        </p>
      </Card>

      {error && (
        <Alert variant="danger" title="No se pudieron cargar las asignaciones">
          Verificá tu conexión e intentá nuevamente.
        </Alert>
      )}

      {isLoading && (
        <div className="page-state">
          <Spinner size="lg" label="Cargando asignaciones…" />
          <p className="page-state__hint">Cargando asignaciones…</p>
        </div>
      )}

      {assignments && assignments.length === 0 && !isLoading && (
        <EmptyState
          icon="ClipboardList"
          title="Todavía no tenés asignaciones"
          description="Cuando tu terapeuta te asigne una técnica, aparecerá acá lista para que la completes."
        />
      )}

      {assignments && assignments.length > 0 && (
        <ul className="assignments-list" aria-label="Lista de asignaciones">
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

      {/*
        Bottom-row CTA so the page never feels like a dead-end beyond the
        hero. Patients who already finished everything can reach messages.
      */}
      {assignments && assignments.length > 0 && (
        <div className="assignments-list__footer">
          <Button variant="ghost">
            <Icon name="MessageSquare" size="sm" />
            Ir a mensajes
          </Button>
        </div>
      )}
    </div>
  );
}
