import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TechniqueCard } from '../components/TechniqueCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { Technique } from '@coterapeuta/shared';

/**
 * Therapist technique library. Displays a Card-based header with a "Nueva
 * técnica" CTA, a category filter Input, and a grid of TechniqueCards.
 *
 * The filter is a free-text search over the API's `?category=` parameter
 * (server-side exact match); the empty state helps the therapist discover
 * the no-results case.
 */
export function TechniqueLibraryPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: techniques, isLoading, error } = useQuery<Technique[]>({
    queryKey: ['techniques', categoryFilter],
    queryFn: () => {
      const path = categoryFilter
        ? `/techniques?category=${encodeURIComponent(categoryFilter)}`
        : '/techniques';
      return api.get<Technique[]>(path);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/techniques/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] });
    },
  });

  return (
    <div className="page-stack">
      <Card
        padding="lg"
        className="technique-library-header"
        aria-label="Biblioteca de técnicas"
        actions={
          <Link to="/library/new" className="button button--primary button-link">
            <Icon name="Plus" size="sm" />
            Nueva técnica
          </Link>
        }
      >
        <div className="technique-library-header__intro">
          <p className="technique-library-header__eyebrow">
            <Icon name="BookOpen" size="xs" /> Biblioteca
          </p>
          <h1 className="technique-library-header__title">Técnicas que usás con tus pacientes</h1>
          <p className="technique-library-header__subtitle">
            Creá, editá y reutilizá técnicas. Cada técnica puede asignarse a un paciente
            y él te dejará un registro de cómo le fue.
          </p>
        </div>
      </Card>

      <Card padding="md" className="technique-library-filter">
        <Input
          label="Filtrar por categoría"
          id="categoryFilter"
          type="text"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          placeholder="Ej.: Respiración, Mindfulness…"
          hint="Las categorías deben coincidir exactamente. Dejá vacío para ver todas."
        />
      </Card>

      {error && (
        <Alert variant="danger" title="No se pudieron cargar las técnicas">
          Verificá tu conexión e intentá nuevamente.
        </Alert>
      )}

      {isLoading && (
        <div className="page-state">
          <Spinner size="lg" label="Cargando técnicas…" />
          <p className="page-state__hint">Cargando técnicas…</p>
        </div>
      )}

      {techniques && techniques.length === 0 && !isLoading && (
        <EmptyState
          icon="BookOpen"
          title={
            categoryFilter
              ? 'No hay técnicas en esta categoría'
              : 'Tu biblioteca está vacía'
          }
          description={
            categoryFilter
              ? `Probá con otra categoría o limpiá el filtro para ver todas.`
              : 'Las técnicas que crees acá se podrán asignar a tus pacientes.'
          }
          action={
            categoryFilter ? (
              <Button variant="ghost" onClick={() => setCategoryFilter('')}>
                <Icon name="X" size="sm" />
                Limpiar filtro
              </Button>
            ) : (
              <Link to="/library/new" className="button button--primary button-link">
                <Icon name="Plus" size="sm" />
                Crear primera técnica
              </Link>
            )
          }
        />
      )}

      {techniques && techniques.length > 0 && (
        <div className="technique-library-grid" role="list" aria-label="Técnicas disponibles">
          {techniques.map((t) => (
            <TechniqueCard
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              category={t.category}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === t.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
