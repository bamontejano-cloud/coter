import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { RegisterWithInvitationPage } from '../RegisterWithInvitationPage';
import { mockFetch, renderWithProviders } from './test-utils';
import { useAuthStore } from '../../store/authStore';

/**
 * RegisterWithInvitationPage: covers the happy path (valid token from URL
 * param, server creates patient user and returns JWT) and the error path
 * (server rejects invitation as invalid/expired).
 *
 * URL pattern: /register/:token — MemoryRouter injects this for us.
 */
describe('RegisterWithInvitationPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it('invitation code in URL is sent and patient account is created on success', async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        ok: true,
        status: 201,
        body: {
          token: 'jwt-patient-xyz',
          user: { id: 'p-1', fullName: 'Juan López', email: 'juan@example.com', role: 'patient' },
        },
      },
    ]);

    renderWithProviders(
      <Routes>
        <Route
          path="/register/:token"
          element={<RegisterWithInvitationPage />}
        />
      </Routes>,
      { initialEntries: ['/register/INV-VALID-TOKEN'] },
    );

    await user.type(screen.getByLabelText('Nombre completo'), 'Juan López');
    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'patientpass1');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('jwt-patient-xyz');
      expect(useAuthStore.getState().user?.role).toBe('patient');
    });

    // Assert the request actually carried the invitation code from the URL.
    const fetchSpy = vi.mocked(window.fetch);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0] ?? [];
    expect(String(calledUrl)).toMatch(/\/auth\/register$/);
    const body = JSON.parse(String(calledInit?.body));
    expect(body).toMatchObject({
      role: 'patient',
      invitationCode: 'INV-VALID-TOKEN',
    });
  });

  it('shows server error and does not store token when invitation is invalid/expired', async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        ok: false,
        status: 400,
        body: { error: 'invalid_invitation', message: 'La invitación no es válida o ha expirado' },
      },
    ]);

    renderWithProviders(
      <Routes>
        <Route
          path="/register/:token"
          element={<RegisterWithInvitationPage />}
        />
      </Routes>,
      { initialEntries: ['/register/INV-EXPIRED'] },
    );

    await user.type(screen.getByLabelText('Nombre completo'), 'Test');
    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'reallysecret');
    await user.click(screen.getByRole('button', { name: /registrarse/i }));

    expect(
      await screen.findByText('La invitación no es válida o ha expirado'),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
