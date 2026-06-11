import { Link } from 'react-router-dom';

interface TechniqueCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function TechniqueCard({ id, title, description, category, onDelete, isDeleting }: TechniqueCardProps) {
  return (
    <article aria-label={`Técnica: ${title}`} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
      <h3>{title}</h3>
      <p><strong>Categoría:</strong> {category}</p>
      <p>{description}</p>
      <Link to={`/library/${id}/edit`}>Editar</Link>
      {' | '}
      <button
        onClick={() => onDelete(id)}
        disabled={isDeleting}
        aria-label={`Eliminar técnica ${title}`}
      >
        {isDeleting ? 'Eliminando…' : 'Eliminar'}
      </button>
    </article>
  );
}
