import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import type { Role } from '@coterapeuta/shared';

interface QuickLink {
  to: string;
  label: string;
  description: string;
  roles: readonly Role[];
}

const QUICK_LINKS: readonly QuickLink[] = [
  {
    to: '/patients',
    label: 'Mis pacientes',
    description: 'Lista de pacientes vinculados y sus perfiles.',
    roles: ['therapist'],
  },
  {
    to: '/library',
    label: 'Biblioteca de técnicas',
    description: 'Técnicas que puedes asignar a tus pacientes.',
    roles: ['therapist'],
  },
  {
    to: '/assignments',
    label: 'Mis asignaciones',
    description: 'Técnicas que has recibido para trabajar.',
    roles: ['patient'],
  },
  {
    to: '/messages',
    label: 'Mensajes',
    description: 'Conversación con tu terapeuta o paciente.',
    roles: ['therapist', 'patient'],
  },
] as const;

/**
 * Authenticated landing page for both therapist and patient roles.
 *
 * The persistent header (logo + user menu + logout) and sidebar (role-aware
 * navigation) live in AppShell — this page only renders the body content.
 */
export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const visibleLinks = user
    ? QUICK_LINKS.filter((l) => l.roles.includes(user.role))
    : [];

  return (
    <>
      <header className="page-header">
        <h1>Bienvenido/a, {user?.fullName ?? '—'}</h1>
        <p className="page-header__subtitle">
          {user?.role === 'therapist'
            ? 'Aquí tienes un resumen de tu espacio de trabajo.'
            : 'Aquí tienes tus asignaciones y mensajes pendientes.'}
        </p>
      </header>

      <section aria-labelledby="quick-actions-title" className="quick-actions">
        <h2 id="quick-actions-title" className="quick-actions__title">
          Accesos rápidos
        </h2>
        <ul className="quick-actions__grid">
          {visibleLinks.map((link) => (
            <li key={link.to} className="quick-actions__item">
              <Link to={link.to} className="quick-actions__card">
                <span className="quick-actions__label">{link.label}</span>
                <span className="quick-actions__description">{link.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
