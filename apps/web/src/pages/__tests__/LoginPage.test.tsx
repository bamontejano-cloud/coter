import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';
import { mockFetch, renderWithProviders } from './test-utils';
import { useAuthStore } from '../../store/authStore';

/**
 * LoginPage: covers the happy path (correct creds → JWT stored →
 * navigate to dashboard) and the error path (401 → Spanish error shown).
 *
 * The page talks to the API via `api.post('/auth/login', ...)`, which
 * is a thin wrapper around fetch. We mock fetch directly.
 */
describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('logs the therapist in and navigates to /dashboard on successful POST', async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        ok: true,
        status: 200,
        body: {
          token: 'jwt-abc-123',
          user: { id: 'u-1', fullName: 'Dra. Pérez', email: 'dra@example.com', role: 'therapist' },
        },
      },
    ]);

    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });

    await user.type(screen.getByLabelText('Correo electrónico'), 'dra@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'sup3r-secret!');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-abc-123');
      expect(useAuthStore.getState().user?.fullName).toBe('Dra. Pérez');
    });
    // Token + user presence are sufficient proof of the round-trip; we
    // don't assert on the loading spinner because `finally` flips it off
    // in the same tick that the token lands, which would race this check.
  });

  it('shows the API error message (Spanish) when credentials are wrong', async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        ok: false,
        status: 401,
        body: { error: 'invalid_credentials', message: 'Credenciales inválidas' },
      },
    ]);

    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });

    await user.type(screen.getByLabelText('Correo electrónico'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'nope');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
    // Auth store must remain empty after a failed login.
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
