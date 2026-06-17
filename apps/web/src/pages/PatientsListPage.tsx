import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { PatientSummary, InvitationCreateResponse } from '@coterapeuta/shared';

/**
 * Therapist-only patient list. Lets the therapist generate an invitation
 * code that a new patient can use to register and link up.
 *
 * Layout provided by AppShell — this page only renders the body content.
 */
export function PatientsListPage() {
  const { data: patients, isLoading, error } = useQuery<PatientSummary[]>({
    queryKey: ['patients'],
    queryFn: () => api.get<PatientSummary[]>('/patients'),
  });
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const generateInvitation = useMutation({
    mutationFn: () => api.post<InvitationCreateResponse>('/invitations'),
    onSuccess: (data) => {
      setInvitationCode(data.code);
      setInvitationError(null);
    },
    onError: () => {
      setInvitationError('No se pudo generar la invitación');
    },
  });

  async function copyInvitationLink() {
    if (!invitationCode) return;
    const link = `${window.location.origin}/register/${invitationCode}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard unavailable in some contexts — degradation: leave the link visible.
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Mis pacientes</h1>
        <p className="page-header__subtitle">
          Genera un código de invitación para vincular a un nuevo paciente.
        </p>
      </header>

      <section className="panel" aria-label="Generar invitación">
        <button
          type="button"
          className="button button--primary"
          onClick={() => generateInvitation.mutate()}
          disabled={generateInvitation.isPending}
        >
          {generateInvitation.isPending ? 'Generando…' : 'Generar invitación'}
        </button>

        {invitationCode && (
          <div className="invitation-result" role="status" aria-live="polite">
            <p className="invitation-result__label">Código de invitación:</p>
            <code className="invitation-result__code">{invitationCode}</code>
            <p className="invitation-result__label">Enlace de registro:</p>
            <Link
              to={`/register/${invitationCode}`}
              className="invitation-result__link"
            >
              {window.location.origin}/register/{invitationCode}
            </Link>
            <button
              type="button"
              className="button button--ghost"
              onClick={copyInvitationLink}
            >
              Copiar enlace
            </button>
          </div>
        )}

        {invitationError && (
          <p role="alert" className="alert alert--danger">
            {invitationError}
          </p>
        )}
      </section>

      <section aria-labelledby="patients-list-title" className="panel">
        <h2 id="patients-list-title" className="panel__title">
          Pacientes vinculados
        </h2>

        {isLoading && <p className="muted">Cargando pacientes…</p>}
        {error && (
          <p role="alert" className="alert alert--danger">
            Error al cargar pacientes
          </p>
        )}

        {patients && patients.length === 0 && (
          <p className="muted">No tienes pacientes vinculados todavía.</p>
        )}

        {patients && patients.length > 0 && (
          <ul className="patient-list">
            {patients.map((patient) => (
              <li key={patient.id} className="patient-list__item">
                <Link to={`/patients/${patient.id}`} className="patient-list__link">
                  <span className="patient-list__name">{patient.fullName}</span>
                  <span className="patient-list__meta">{patient.email}</span>
                </Link>
                <span className="patient-list__date">
                  Vinculado:{' '}
                  <time dateTime={patient.linkedAt}>
                    {new Date(patient.linkedAt).toLocaleDateString('es-ES')}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
