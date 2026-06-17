import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { Avatar } from '../components/ui/Avatar';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon, IconName } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { Assignment, PatientSummary, Role } from '@coterapeuta/shared';

interface QuickLink {
  to: string;
  label: string;
  description: string;
  icon: IconName;
  roles: readonly Role[];
}

const QUICK_LINKS: readonly QuickLink[] = [
  {
    to: '/patients',
    label: 'Mis pacientes',
    description: 'Lista de pacientes vinculados y sus perfiles.',
    icon: 'Users',
    roles: ['therapist'],
  },
  {
    to: '/library',
    label: 'Biblioteca de técnicas',
    description: 'Técnicas que podés asignar a tus pacientes.',
    icon: 'BookOpen',
    roles: ['therapist'],
  },
  {
    to: '/assignments',
    label: 'Mis asignaciones',
    description: 'Técnicas que tenés para trabajar.',
    icon: 'ClipboardList',
    roles: ['patient'],
  },
  {
    to: '/messages',
    label: 'Mensajes',
    description: 'Conversación con tu terapeuta o paciente.',
    icon: 'MessageSquare',
    roles: ['therapist', 'patient'],
  },
] as const;

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface DashStat {
  label: string;
  value: number | string;
  icon: IconName;
  tone: Tone;
  description: string;
}

/**
 * Authenticated landing page for both therapist and patient roles.
 *
 * Visual structure:
 *  1. Hero card — gradient background, large avatar, personalized greeting.
 *  2. Stat row — 2 role-aware StatCards with real numbers from existing
 *     endpoints, so the page still reads as a "looking-glass" dashboard
 *     even before the user clicks anywhere.
 *  3. Quick actions grid — role-aware cards with icons.
 *  4. Empty state when a role has no actionable data (e.g. a therapist with
 *     0 patients and 0 unread messages).
 *
 * The persistent header (logo + user menu + logout) and sidebar live in
 * AppShell; this page only renders body content.
 */
export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const notificationCount = useNotificationStore((s) => s.count);

  const isTherapist = user?.role === 'therapist';
  const isPatient = user?.role === 'patient';

  // UseQuery hooks only fire when the role matches — otherwise the data
  // wouldn't match what the page is showing.
  const { data: patients } = useQuery<PatientSummary[]>({
    queryKey: ['patients'],
    queryFn: () => api.get<PatientSummary[]>('/patients'),
    enabled: !!isTherapist,
  });
  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: () => api.get<Assignment[]>('/assignments'),
    enabled: !!isPatient,
  });

  const visibleLinks = user
    ? QUICK_LINKS.filter((l) => l.roles.includes(user.role))
    : [];

  const heroSubtitle =
    user?.role === 'therapist'
      ? 'Generá códigos de invitación para nuevos pacientes, asigná técnicas curadas y acompañá el proceso semana a semana.'
      : 'Encontrá tus asignaciones pendientes, registrá tu progreso y mantené la conversación con tu terapeuta.';

  const pendingCount = assignments?.filter((a) => a.status === 'pending').length ?? 0;
  const completedCount = assignments?.filter((a) => a.status === 'completed').length ?? 0;

  const stats: DashStat[] =
    user?.role === 'therapist'
      ? [
          {
            label: 'Pacientes activos',
            value: patients?.length ?? 0,
            icon: 'Users',
            tone: 'brand',
            description: 'Vinculados a tu consultorio',
          },
          {
            label: 'Mensajes sin leer',
            value: notificationCount ?? 0,
            icon: 'MessageSquare',
            tone: 'info',
            description: 'Conversaciones pendientes',
          },
        ]
      : user?.role === 'patient'
      ? [
          {
            label: 'Asignaciones pendientes',
            value: pendingCount,
            icon: 'ClipboardList',
            tone: 'warning',
            description: 'Esperan tu respuesta',
          },
          {
            label: 'Asignaciones completadas',
            value: completedCount,
            icon: 'CheckCircle',
            tone: 'success',
            description: 'Finalizadas hasta hoy',
          },
        ]
      : [];

  const showEmptyCta =
    !!user &&
    ((isTherapist && (patients?.length ?? 0) === 0 && (notificationCount ?? 0) === 0) ||
      (isPatient && pendingCount === 0 && completedCount === 0));

  return (
    <>
      <section className="dashboard-hero" aria-label="Bienvenida">
        <Avatar
          name={user?.fullName ?? '—'}
          size="xl"
          className="dashboard-hero__avatar"
        />
        <div className="dashboard-hero__content">
          <h1 className="dashboard-hero__greeting">
            Bienvenido/a, {user?.fullName ?? '—'}
          </h1>
          <p className="dashboard-hero__sub">{heroSubtitle}</p>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="dashboard-stats" aria-label="Resumen">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              tone={s.tone}
              description={s.description}
            />
          ))}
        </section>
      )}

      {showEmptyCta && (
        <EmptyState
          icon={isTherapist ? 'Sparkles' : 'Activity'}
          title={isTherapist ? 'Empezá a construir tu espacio' : 'Aún no hay asignaciones'}
          description={
            isTherapist
              ? 'Generá un código de invitación y vinculá a tu primer paciente para empezar a asignar técnicas.'
              : 'Cuando tu terapeuta te asigne técnicas, las vas a ver acá.'
          }
        />
      )}

      <section
        aria-labelledby="quick-actions-title"
        className="quick-actions"
      >
        <h2 id="quick-actions-title" className="quick-actions__title">
          Accesos rápidos
        </h2>
        <ul className="quick-actions__grid">
          {visibleLinks.map((link) => (
            <li key={link.to} className="quick-actions__item">
              <Link to={link.to} className="quick-actions__card">
                <span className="quick-actions__icon" aria-hidden="true">
                  <Icon name={link.icon} size="md" />
                </span>
                <span className="quick-actions__copy">
                  <span className="quick-actions__label">{link.label}</span>
                  <span className="quick-actions__description">{link.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
