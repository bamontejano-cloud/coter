import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Icon, IconName } from '../components/ui/Icon';
import type { AuthResponse, Role } from '@coterapeuta/shared';

const BRAND_POINTS: ReadonlyArray<{ icon: IconName; text: string }> = [
  { icon: 'Sparkles', text: 'Empezá en minutos, sin tarjeta de crédito.' },
  { icon: 'Heart',    text: 'Diseñado con clínicos, para personas reales.' },
  { icon: 'Activity', text: 'Resultados visibles semana a semana.' },
];

/**
 * Therapist self-registration (no invitation). Same split-screen layout as
 * LoginPage, with brand copy tailored to "create an account".
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>('/auth/register', {
        fullName,
        email,
        password,
        role: 'therapist' satisfies Role,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen auth-screen--split">
      <aside className="auth-screen__brand" aria-hidden="false">
        <div className="auth-screen__brand-mark">
          <span className="auth-screen__brand-mark-icon">
            <Icon name="Sparkles" size="md" />
          </span>
          <span>Coterapeuta</span>
        </div>

        <h2 className="auth-screen__brand-tagline">
          Creá tu cuenta y empezá a acompañar pacientes hoy.
        </h2>
        <p className="auth-screen__brand-sub">
          Acceso inmediato a la biblioteca de técnicas, gestión de pacientes y
          herramientas de seguimiento.
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
          aria-label="Formulario de registro"
          noValidate
        >
          <h1 className="auth-screen__form-title">Crear cuenta</h1>
          <p className="auth-screen__form-subtitle">
            Te registrás como terapeuta. Los pacientes se vinculan con un código de invitación.
          </p>

          {error && (
            <Alert variant="danger" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Input
            label="Nombre completo"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña (mínimo 8 caracteres)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            hint="Usá al menos 8 caracteres."
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>

          <p className="auth-screen__footer">
            ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}