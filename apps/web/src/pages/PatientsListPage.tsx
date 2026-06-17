import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import type { PatientSummary, InvitationCreateResponse } from '@coterapeuta/shared';

/**
 * Therapist-only patient list. Lets the therapist generate an invitation
 * code that a new patient can use to register and link up.
 *
 * Layout provided by AppShell — this page only renders the body content.
 * Uses the design-system primitives:
 *  - <Card> for the two section panels.
 *  - <Button> for actions, with isLoading for the async generate/save state.
 *  - <Alert> for the sticky page-load error (persistent, near its source).
 *  - <Toast> for transient feedback on the invitation/copy flows
 *    (success + error, sticky for danger per the toast contract).
 */
export function PatientsListPage() {
  const toast = useToast();
  const { data: patients, isLoading, error } = useQuery<PatientSummary[]>({
    queryKey: ['patients'],
    queryFn: () => api.get<PatientSummary[]>('/patients'),
  });
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  const generateInvitation = useMutation({
    mutationFn: () => api.post<InvitationCreateResponse>('/invitations'),
    onSuccess: (data) => {
      setInvitationCode(data.code);
      toast.push({ variant: 'success', message: `Invitación generada: ${data.code}` });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'No se pudo generar la invitación';
      toast.push({ variant: 'danger', message });
    },
  });

  async function copyInvitationLink() {
    if (!invitationCode) return;
    const link = `${window.location.origin}/register/${invitationCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.push('Enlace copiado al portapapeles');
    } catch {
      // Clipboard unavailable in some contexts (e.g. insecure origins).
      toast.push({
        variant: 'warning',
        title: 'No se pudo copiar',
        message: 'Copiá el enlace manualmente desde el panel de invitación.',
      });
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

      <Card
        as="section"
        aria-label="Generar invitación"
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => generateInvitation.mutate()}
            isLoading={generateInvitation.isPending}
          >
            {generateInvitation.isPending ? 'Generando…' : 'Generar invitación'}
          </Button>
        }
      >
        {invitationCode ? (
          <div className="invitation-result" role="status" aria-live="polite">
            <p className="invitation-result__label">Código de invitación:</p>
            <code className="invitation-result__code">{invitationCode}</code>
            <p className="invitation-result__label">Enlace de registro:</p>
            <Link to={`/register/${invitationCode}`} className="invitation-result__link">
              {window.location.origin}/register/{invitationCode}
            </Link>
            <div>
              <Button type="button" variant="ghost" onClick={copyInvitationLink}>
                Copiar enlace
              </Button>
            </div>
          </div>
        ) : (
          <p className="muted">
            Generá un código y compartilo con tu paciente para que pueda registrarse.
          </p>
        )}
      </Card>

      <Card as="section" aria-labelledby="patients-list-title">
        <h2 id="patients-list-title" className="card__title">
          Pacientes vinculados
        </h2>

        {isLoading && (
          <p className="muted" role="status" aria-live="polite">
            <Spinner size="sm" label="" /> Cargando pacientes…
          </p>
        )}

        {error && (
          <Alert variant="danger">Error al cargar pacientes</Alert>
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
      </Card>
    </>
  );
}
