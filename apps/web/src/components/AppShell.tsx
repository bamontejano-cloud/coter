import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { NotificationDot } from './NotificationDot';
import { useNotificationStore } from '../store/notificationStore';
import { useNotifications } from '../hooks/useNotifications';
import { Icon, IconName } from './ui/Icon';
import { Avatar } from './ui/Avatar';
import type { Role } from '@coterapeuta/shared';

/**
 * One nav entry in the sidebar. `roles` undefined = visible to everyone
 * (any authenticated user). Defined list narrows to those roles.
 */
interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  roles?: readonly Role[];
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { to: '/dashboard',           label: 'Inicio',                      icon: 'Home'           },
  { to: '/patients',            label: 'Mis pacientes',              icon: 'Users',          roles: ['therapist'] },
  { to: '/library',             label: 'Biblioteca de técnicas',     icon: 'BookOpen',       roles: ['therapist'] },
  { to: '/assignments',         label: 'Mis asignaciones',           icon: 'ClipboardList',  roles: ['patient']   },
  { to: '/messages',            label: 'Mensajes',                    icon: 'MessageSquare'                     },
] as const;

/**
 * Authenticated layout shell.
 *
 * Wraps every page that lives behind <ProtectedRoute />. Provides a sticky
 * header (brand + user menu + logout) and a role-aware sidebar with active
 * link highlighting + per-entry icons. The child route renders into
 * <Outlet/> below.
 *
 * Mobile (<768px by default): sidebar collapses behind a hamburger toggle.
 * Keyboard users get a skip-link that jumps them to <main>.
 */
export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Therapist notifications — keep the polling running while the shell is mounted.
  useNotifications();
  const notificationCount = useNotificationStore((s) => s.count);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const visibleEntries = NAV_ENTRIES.filter(
    (e) => !e.roles || (user && e.roles.includes(user.role)),
  );

  const roleLabel = user?.role === 'therapist' ? 'Terapeuta' : 'Paciente';

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <header className="app-header">
        <button
          type="button"
          className="app-header__menu-toggle"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Icon name={sidebarOpen ? 'X' : 'Menu'} size="md" />
        </button>

        <Link to="/dashboard" className="app-header__brand" aria-label="Inicio · Coterapeuta">
          <span className="app-header__brand-mark" aria-hidden="true">
            <Icon name="Stethoscope" size="sm" />
          </span>
          <span className="app-header__brand-text">oterapeuta</span>
          {user?.role === 'therapist' && notificationCount > 0 && (
            <NotificationDot count={notificationCount} />
          )}
        </Link>

        <div className="app-header__spacer" />

        {user && (
          <div className="app-header__user" aria-label={`Sesión iniciada como ${user.fullName}`}>
            <div className="app-header__user-info">
              <span className="app-header__user-info-name">{user.fullName}</span>
              <span className="app-header__user-info-role" aria-label={`Rol: ${roleLabel}`}>
                {roleLabel}
              </span>
            </div>
            <Avatar name={user.fullName} size="sm" />
          </div>
        )}

        <button
          type="button"
          className="app-header__logout"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <Icon name="LogOut" size="sm" />
          <span className="app-header__logout-text">Cerrar sesión</span>
        </button>
      </header>

      <div className="app-body">
        <aside
          className="app-sidebar"
          data-open={sidebarOpen}
          aria-label="Navegación principal"
        >
          <nav>
            <ul className="app-sidebar__list">
              {visibleEntries.map((entry) => (
                <li key={entry.to}>
                  <NavLink
                    to={entry.to}
                    className={({ isActive }) =>
                      'app-sidebar__link' + (isActive ? ' app-sidebar__link--active' : '')
                    }
                    onClick={closeSidebar}
                  >
                    <span className="app-sidebar__icon" aria-hidden="true">
                      <Icon name={entry.icon} size="md" />
                    </span>
                    <span className="app-sidebar__link-label">{entry.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="app-sidebar__backdrop"
            aria-label="Cerrar menú"
            onClick={closeSidebar}
          />
        )}

        <main id="main-content" className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
