import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Icon, IconName } from '../components/ui/Icon';
import type { AuthResponse } from '@coterapeuta/shared';

const BRAND_POINTS: ReadonlyArray<{ icon: IconName; text: string }> = [
  { icon: 'ShieldCheck',  text: 'Privacidad y seguridad clínica desde el primer día.' },
  { icon: 'ClipboardList', text: 'Asigná técnicas y hacé seguimiento de adherencia.' },
  { icon: 'MessageSquare', text: 'Conversación directa entre terapeuta y paciente.' },
];

/**
 * Pre-auth screen with split layout: brand panel on the left (gradient,
 * tagline, three highlight points with icons) and the sign-in form on the
 * right. Below 768px the brand panel collapses so the form fills the
 * viewport, mirroring mobile-friendly commercial auth flows.
 *
 * No AppShell — no logged-in session means no header/sidebar.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--split">
      <aside className="auth-screen__brand" aria-hidden="false">
        <div className="auth-screen__brand-mark">
          <span className="auth-screen__brand-mark-icon">
            <Icon name="Stethoscope" size="md" />
          </span>
          <span>Coterapeuta</span>
        </div>

        <h2 className="auth-screen__brand-tagline">
          Acompañá a tus pacientes con técnicas que funcionan.
        </h2>
        <p className="auth-screen__brand-sub">
          Una plataforma diseñada para que terapeutas y pacientes trabajen juntos
          sobre técnicas terapéuticas curadas, asignación y seguimiento.
        </p>

        <ul className="auth-screen__brand-points">
          {BRAND_POINTS.map((p) => (
            <li key={p.text} className="auth-screen__brand-point">
              <span className="auth-screen__brand-point-icon">
                <Icon name={p.icon} size="sm" />
              </span>
              <span>{p.text}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth-screen__form-side">
        <form
          className="auth-screen__form-card"
          onSubmit={handleSubmit}
          aria-label="Formulario de inicio de sesión"
          noValidate
        >
          <h1 className="auth-screen__form-title">Iniciar sesión</h1>
          <p className="auth-screen__form-subtitle">Ingresá a tu espacio de trabajo.</p>

          {error && (
            <Alert variant="danger" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Ingresando…' : 'Entrar'}
          </Button>

          <p className="auth-screen__footer">
            ¿No tenés cuenta? <Link to="/register">Registrarme</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
