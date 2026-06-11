import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';

interface AssignmentCardProps {
  id: string;
  techniqueTitle: string;
  status: 'pending' | 'completed';
  assignedAt: string;
  therapistNotes?: string;
}

export function AssignmentCard({ id, techniqueTitle, status, assignedAt, therapistNotes }: AssignmentCardProps) {
  return (
    <article aria-label={`Asignación: ${techniqueTitle}`} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
      <h3>
        <Link to={`/assignments/${id}`}>{techniqueTitle}</Link>
      </h3>
      <StatusBadge status={status} />
      <p>Asignada: {new Date(assignedAt).toLocaleDateString('es-ES')}</p>
      {therapistNotes && <p><em>Notas del terapeuta: {therapistNotes}</em></p>}
    </article>
  );
}
