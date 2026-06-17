import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { Icon, IconName } from './ui/Icon';
import type { AssignmentSummary, AssignmentStatus } from '@coterapeuta/shared';

interface AssignmentCardProps {
  assignment: AssignmentSummary;
}

/**
 * Map assignment status → lucide icon that hints at the state. Decorative;
 * StatusBadge carries the accessible label.
 */
const STATUS_ICON: Record<AssignmentStatus, IconName> = {
  pending: 'ClipboardList',
  completed: 'CheckCircle',
};

/**
 * Single row in the patient-side assignments list. Whole card is a Link so
 * the touch target is the full tile (more accessible than a title link
 * alone). StatusBadge tells the user at-a-glance whether action is needed.
 */
export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { id, techniqueTitle, status, assignedAt, therapistNotes } = assignment;

  return (
    <Link
      to={`/assignments/${id}`}
      className="assignment-row"
      aria-label={`Asignación: ${techniqueTitle} — ${status === 'pending' ? 'pendiente' : 'completada'}`}
    >
      <span className="assignment-row__icon" aria-hidden="true">
        <Icon name={STATUS_ICON[status]} size="md" />
      </span>
      <span className="assignment-row__main">
        <span className="assignment-row__title">{techniqueTitle}</span>
        {therapistNotes && (
          <span className="assignment-row__notes">{therapistNotes}</span>
        )}
        <span className="assignment-row__date">
          Asignada el{' '}
          <time dateTime={assignedAt}>
            {new Date(assignedAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </span>
      </span>
      <StatusBadge status={status} />
      <span className="assignment-row__chevron" aria-hidden="true">
        <Icon name="ChevronRight" size="sm" />
      </span>
    </Link>
  );
}
