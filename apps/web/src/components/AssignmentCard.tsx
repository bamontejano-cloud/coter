import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import type { AssignmentSummary } from '@coterapeuta/shared';

interface AssignmentCardProps {
  assignment: AssignmentSummary;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { id, techniqueTitle, status, assignedAt, therapistNotes } = assignment;
  return (
    <article
      aria-label={`Asignación: ${techniqueTitle}`}
      style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}
    >
      <h3>
        <Link to={`/assignments/${id}`}>{techniqueTitle}</Link>
      </h3>
      <StatusBadge status={status} />
      <p>Asignada: {new Date(assignedAt).toLocaleDateString('es-ES')}</p>
      {therapistNotes && (
        <p>
          <em>Notas del terapeuta: {therapistNotes}</em>
        </p>
      )}
    </article>
  );
}
