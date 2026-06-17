import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AssignmentDetailPage } from '../AssignmentDetailPage';
import { mockFetch, renderWithProviders } from './test-utils';
import { useAuthStore } from '../../store/authStore';
import type { Assignment, AssignmentStatus } from '@coterapeuta/shared';

/**
 * AssignmentDetailPage: covers the patient-side submission flow.
 *
 * 1. Page loads the assignment list (`GET /assignments`).
 * 2. If status is 'pending', the form is shown.
 * 3. Patient submits the response → `POST /records` succeeds → page
 *    navigates to /assignments and the assignment status flips to
 *    'completed' on subsequent fetches.
 *
 * The queryFn for the assignment re-fetches by calling `GET /assignments`
 * and slicing by id (current implementation). We mirror that here so the
 * second fetch returns 'completed'.
 */
function makeAssignment(status: AssignmentStatus, id = 'a-1'): Assignment {
  return {
    id,
    techniqueId: 't-1',
    technique: { title: 'Respiración diafragmática' },
    patientId: 'p-1',
    therapistId: 'th-1',
    therapistNotes: 'Practica 5 minutos diarios.',
    status,
    assignedAt: '2026-06-01T10:00:00Z',
  };
}

describe('AssignmentDetailPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
  });

  it('renders the submission form while pending, then transitions to completed after submit', async () => {
    const user = userEvent.setup();
    // Mock both fetches: GET /assignments (initial), POST /records (submit).
    // The page navigates away before refetching, so we only need the two.
    mockFetch([
      // 1) GET /assignments — returns list with one pending assignment.
      {
        ok: true,
        status: 200,
        body: [
          makeAssignment('pending', 'a-1'),
          makeAssignment('pending', 'a-2'),
        ],
      },
      // 2) POST /records — succeeds.
      {
        ok: true,
        status: 201,
        body: {
          id: 'r-1',
          assignmentId: 'a-1',
          patientId: 'p-1',
          response: 'Realicé la práctica 5 minutos esta mañana.',
          submittedAt: '2026-06-17T09:00:00Z',
        },
      },
    ]);

    renderWithProviders(
      <Routes>
        <Route
          path="/assignments/:id"
          element={<AssignmentDetailPage />}
        />
      </Routes>,
      { initialEntries: ['/assignments/a-1'] },
    );

    // Page loads, shows the pending form.
    expect(await screen.findByRole('heading', { name: /respiración/i })).toBeInTheDocument();
    const textarea = await screen.findByLabelText('Tu respuesta');
    await user.type(textarea, 'Realicé la práctica 5 minutos esta mañana.');
    await user.click(screen.getByRole('button', { name: /enviar registro/i }));

    // After submit, the page navigates to /assignments.
    await waitFor(() => {
      expect(vi.mocked(window.fetch).mock.calls.map((c) => String(c[0]))).toEqual(
        expect.arrayContaining([expect.stringMatching(/\/assignments$/), expect.stringMatching(/\/records$/)]),
      );
    });

    // Verify the POST body carried the assignment id + response text.
    const calls = vi.mocked(window.fetch).mock.calls;
    const recordsCall = calls.find((c) => String(c[0]).match(/\/records$/));
    expect(recordsCall).toBeDefined();
    const recordsBody = JSON.parse(String(recordsCall?.[1]?.body));
    expect(recordsBody).toMatchObject({
      assignmentId: 'a-1',
      response: expect.stringContaining('Realicé'),
    });
  });

  it('renders the completed-state message when the assignment is already completed (no form)', async () => {
    mockFetch([
      {
        ok: true,
        status: 200,
        body: [makeAssignment('completed', 'a-1')],
      },
    ]);

    // Setting initialEntries with no-state assignment that becomes completed.
    renderWithProviders(
      <Routes>
        <Route
          path="/assignments/:id"
          element={<AssignmentDetailPage />}
        />
      </Routes>,
      { initialEntries: ['/assignments/a-1'] },
    );

    expect(await screen.findByText(/ya ha sido completada/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
  });
});
