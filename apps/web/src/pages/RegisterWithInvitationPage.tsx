import { useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import type { AuthResponse, Role } from '@coterapeuta/shared';

export function RegisterWithInvitationPage() {
  const navigate = useNavigate();
  const { token: invitationCode } = useParams<{ token: string }>();
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
        role: 'patient' satisfies Role,
        invitationCode,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Crear cuenta de paciente</h1>
      <form onSubmit={handleSubmit} aria-label="Formulario de registro con invitación">
        {error && <p role="alert" aria-live="assertive" style={{ color: 'red' }}>{error}</p>}
        <div>
          <label htmlFor="fullName">Nombre completo</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
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
        <div>
          <label htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando…' : 'Registrarse'}
        </button>
      </form>
    </main>
  );
}
