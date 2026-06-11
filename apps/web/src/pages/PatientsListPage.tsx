import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  linkedAt: string;
}

function usePatients() {
  const token = useAuthStore((s) => s.token);
  return useQuery<PatientSummary[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar pacientes');
      return res.json();
    },
  });
}

export function PatientsListPage() {
  const { data: patients, isLoading, error } = usePatients();
  const token = useAuthStore((s) => s.token);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const generateInvitation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/invitations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Error al generar invitación');
      return res.json() as Promise<{ code: string; expiresAt: string }>;
    },
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
