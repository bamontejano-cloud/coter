import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import type { AuthResponse } from '@coterapeuta/shared';

/**
 * Pre-auth screen. Centered card layout (`.auth-screen`) so the visual rhythm
 * matches the rest of the app. No AppShell here — there is no logged-in
 * session to render a header for.
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
      >
        <h1>Iniciar sesión</h1>

        {error && (
          <p role="alert" aria-live="assertive" className="alert alert--danger">
            {error}
          </p>
        )}

        <div className="auth-screen__field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-screen__field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="button button--primary auth-screen__submit"
          disabled={loading}
        >
          {loading ? 'Cargando…' : 'Entrar'}
        </button>

        <p className="auth-screen__footer">
          ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
        </p>
      </form>
    </div>
  );
}
