import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { PatientSummary, InvitationCreateResponse } from '@coterapeuta/shared';

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

  return (
    <main>
      <h1>Mis pacientes</h1>
      <button
        onClick={() => generateInvitation.mutate()}
        disabled={generateInvitation.isPending}
        aria-label="Generar código de invitación para nuevo paciente"
      >
        {generateInvitation.isPending ? 'Generando…' : 'Generar invitación'}
      </button>

      {invitationCode && (
        <section aria-live="polite">
          <p>Código de invitación:</p>
          <code>{invitationCode}</code>
          <p>
            Comparte este enlace:{' '}
            <a href={`/register/${invitationCode}`}>
              {window.location.origin}/register/{invitationCode}
            </a>
          </p>
        </section>
      )}
      {invitationError && <p role="alert" style={{ color: 'red' }}>{invitationError}</p>}

      {isLoading && <p>Cargando pacientes…</p>}
      {error && <p role="alert" style={{ color: 'red' }}>Error al cargar pacientes</p>}

      {patients && patients.length === 0 && (
        <p>No tienes pacientes vinculados todavía.</p>
      )}

      {patients && patients.length > 0 && (
        <ul aria-label="Lista de pacientes">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link to={`/patients/${patient.id}`}>
                <strong>{patient.fullName}</strong>
              </Link>
              {' — '}
              {patient.email}
              {' — Vinculado: '}
              {new Date(patient.linkedAt).toLocaleDateString('es-ES')}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
