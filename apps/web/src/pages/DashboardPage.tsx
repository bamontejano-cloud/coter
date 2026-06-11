import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { RoleGuard } from '../components/RoleGuard';
import { NotificationDot } from '../components/NotificationDot';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/notificationStore';

export function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const count = useNotificationStore((s) => s.count);

  // Start polling for therapist notifications
  useNotifications();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <main>
      <h1>
        Dashboard
        <RoleGuard roles={['therapist']}>
          <NotificationDot count={count} />
        </RoleGuard>
      </h1>
      <p>Bienvenido/a, <strong>{user?.fullName}</strong></p>
      <RoleGuard roles={['therapist']}>
        <nav aria-label="Navegación del terapeuta">
          <a href="/patients">Mis pacientes</a> |{' '}
          <a href="/library">Biblioteca de técnicas</a> |{' '}
          <a href="/messages">Mensajes</a>
        </nav>
      </RoleGuard>
      <RoleGuard roles={['patient']}>
        <nav aria-label="Navegación del paciente">
          <a href="/assignments">Mis asignaciones</a> |{' '}
          <a href="/messages">Mensajes</a>
        </nav>
      </RoleGuard>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </main>
  );
}
