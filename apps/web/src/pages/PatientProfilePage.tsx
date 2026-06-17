import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { Icon, IconName } from '../components/ui/Icon';
import { StatCard } from '../components/ui/StatCard';
import type { PatientProfile, AssignmentSummary } from '@coterapeuta/shared';

/** Map summary status → lucide icon (decorative; the StatusBadge has the real label). */
const STATUS_ICON: Record<AssignmentSummary['status'], IconName> = {
  pending: 'ClipboardList',
  completed: 'CheckCircle',
};

/**
 * Therapist view of a single patient. Shows a profile hero, three top-line
 * stats, and a chronological list of that patient's assignments. Each
 * assignment link goes to its detail page; <Link> gives us middle-click /
 * cmd-click new-tab navigation for free.
 */
export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery<PatientProfile>({
    queryKey: ['patient', id],
    queryFn: () => api.get<PatientProfile>(`/patients/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="page-state">
        <Spinner size="lg" label="Cargando perfil del paciente…" />
        <p className="page-state__hint">Cargando perfil del paciente…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-state">
        <Alert variant="danger" title="No se pudo cargar el perfil">
          Verificá tu conexión e intentá nuevamente.
        </Alert>
        <div className="page-state__actions">
          <Button variant="ghost" onClick={() => navigate('/patients')}>
            <Icon name="ChevronLeft" size="sm" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const pendingCount = profile.assignments.filter((a) => a.status === 'pending').length;
  const completedCount = profile.assignments.length - pendingCount;

  return (
    <div className="page-stack">
      <Button
        variant="ghost"
        className="page-back-link"
        onClick={() => navigate('/patients')}
      >
        <Icon name="ChevronLeft" size="sm" />
        Volver a la lista
      </Button>

      <Card padding="lg" className="patient-profile-hero" aria-label={`Perfil de ${profile.fullName}`}>
        <div className="patient-profile-hero__avatar">
          <Avatar name={profile.fullName} size="xl" />
        </div>
        <div className="patient-profile-hero__info">
          <p className="patient-profile-hero__eyebrow">
            <Icon name="UserRound" size="xs" /> Paciente
          </p>
          <h1 className="patient-profile-hero__name">{profile.fullName}</h1>
          <p className="patient-profile-hero__contact">
            <Icon name="Mail" size="sm" />
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p className="patient-profile-hero__contact">
            <Icon name="Calendar" size="sm" />
            <span>
              Vinculado el{' '}
              <time dateTime={profile.linkedAt}>
                {new Date(profile.linkedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </span>
          </p>
        </div>
        <div className="patient-profile-hero__actions">
          <Button variant="primary">
            <Icon name="ClipboardList" size="sm" />
            Asignar técnica
          </Button>
          <Button variant="ghost">
            <Icon name="MessageSquare" size="sm" />
            Mensaje
          </Button>
        </div>
      </Card>

      <div className="stat-card-row" aria-label="Resumen del paciente">
        <StatCard
          icon="ClipboardList"
          label="Asignaciones totales"
          value={profile.assignments.length}
          tone="brand"
        />
        <StatCard
          icon="AlertCircle"
          label="Pendientes"
          value={pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'info'}
        />
        <StatCard
          icon="CheckCircle"
          label="Completadas"
          value={completedCount}
          tone="success"
        />
        <StatCard
          icon="MessageSquare"
          label="Mensajes sin leer"
          value={profile.messagesSummary.unreadCount}
          tone={profile.messagesSummary.unreadCount > 0 ? 'danger' : 'info'}
        />
      </div>

      <Card
        title="Asignaciones"
        subtitle="Historial de técnicas que le asignaste."
        aria-label="Asignaciones del paciente"
      >
        {profile.assignments.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="Sin asignaciones todavía"
            description="Cuando le asignes una técnica, aparecerá acá con su estado y notas."
            action={
              <Button variant="primary">
                <Icon name="Plus" size="sm" />
                Asignar primera técnica
              </Button>
            }
          />
        ) : (
          <ul className="patient-assignments-list" aria-label="Historial de asignaciones del paciente">
            {profile.assignments.map((a) => (
              <li key={a.id} className="patient-assignments-list__item">
                <Link
                  to={`/assignments/${a.id}`}
                  className="patient-assignments-list__link"
                  aria-label={`Asignación: ${a.techniqueTitle} — ${a.status === 'pending' ? 'pendiente' : 'completada'}`}
                >
                  <span className="patient-assignments-list__icon" aria-hidden="true">
                    <Icon name={STATUS_ICON[a.status]} size="md" />
                  </span>
                  <span className="patient-assignments-list__main">
                    <span className="patient-assignments-list__title">{a.techniqueTitle}</span>
                    {a.therapistNotes && (
                      <span className="patient-assignments-list__notes">
                        {a.therapistNotes}
                      </span>
                    )}
                    <span className="patient-assignments-list__date">
                      Asignada el{' '}
                      <time dateTime={a.assignedAt}>
                        {new Date(a.assignedAt).toLocaleDateString('es-ES')}
                      </time>
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                  <Icon name="ChevronRight" size="sm" className="patient-assignments-list__chevron" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
