import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import type { AuthResponse } from '@coterapeuta/shared';

/**
 * Pre-auth screen. Centered card layout (`.auth-screen`) with the visual
 * rhythm shared by RegisterPage. Uses the design-system components:
 *  - <Input> for the form fields (label + a11y wired automatically)
 *  - <Button> with isLoading for the submit (Spinner replaces the label)
 *  - <Alert> for sticky error display with a manual dismiss ✕
 *
 * No AppShell here — no logged-in session means no header/sidebar.
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
    <div className="auth-screen">
      <form
        className="auth-screen__card"
        onSubmit={handleSubmit}
        aria-label="Formulario de inicio de sesión"
        noValidate
      >
        <h1>Iniciar sesión</h1>

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

        <Button type="submit" variant="primary" fullWidth isLoading={loading}>
          {loading ? 'Cargando…' : 'Entrar'}
        </Button>

        <p className="auth-screen__footer">
          ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
        </p>
      </form>
    </div>
  );
}
