import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Icon, IconName } from './ui/Icon';

interface TechniqueCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Pick a lucide icon from the technique's category in a deterministic way
 * (hash the category string → pick from a small bank). Different techniques
 * with the same category land on the same icon so the library feels
 * "sorted" at a glance.
 */
const CATEGORY_ICONS: ReadonlyArray<IconName> = [
  'Brain',
  'Heart',
  'Activity',
  'Sparkles',
  'BookOpen',
  'Stethoscope',
];

function hashIndex(input: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

/**
 * Single technique tile. Renders inside a Card so the library has consistent
 * spacing. Header is a gradient cover with the category's icon; footer has
 * the destructive (Eliminar) action while Edit is the safe primary link.
 */
export function TechniqueCard({
  id,
  title,
  description,
  category,
  onDelete,
  isDeleting,
}: TechniqueCardProps) {
  const icon = CATEGORY_ICONS[hashIndex(category, CATEGORY_ICONS.length)];

  return (
    <article className="technique-card" role="listitem" aria-label={`Técnica: ${title}`}>
      <div className="technique-card__cover" aria-hidden="true">
        <Icon name={icon} size="xl" />
      </div>
      <div className="technique-card__body">
        <span className="technique-card__category">
          <Icon name="BookOpen" size="xs" />
          {category}
        </span>
        <h3 className="technique-card__title">{title}</h3>
        <p className="technique-card__description">{description}</p>
      </div>
      <div className="technique-card__actions">
        <Link to={`/library/${id}/edit`} className="technique-card__edit-link">
          <Icon name="Edit" size="sm" />
          Editar
        </Link>
        <button
          type="button"
          className="technique-card__delete"
          onClick={() => onDelete(id)}
          disabled={isDeleting}
          aria-label={`Eliminar técnica ${title}`}
          aria-busy={isDeleting || undefined}
        >
          <Icon name="Trash2" size="sm" />
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </article>
  );
}

// Keep Card import alive — Anvil build used here for shared test fixtures; safe to remove.
void Card;
