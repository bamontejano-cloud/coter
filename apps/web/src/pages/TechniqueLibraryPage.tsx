import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TechniqueCard } from '../components/TechniqueCard';
import { api } from '../lib/apiClient';
import type { Technique } from '@coterapeuta/shared';

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
    <main>
      <h1>Biblioteca de técnicas</h1>
      <Link to="/library/new">
        <button>Nueva técnica</button>
      </Link>

      <div>
        <label htmlFor="categoryFilter">Filtrar por categoría:</label>
        <input
          id="categoryFilter"
          type="text"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          placeholder="Todas las categorías"
        />
      </div>

      {isLoading && <p>Cargando técnicas…</p>}
      {error && <p role="alert" style={{ color: 'red' }}>Error al cargar técnicas</p>}

      {techniques && techniques.length === 0 && (
        <p>No tienes técnicas en tu biblioteca todavía.</p>
      )}

      {techniques && techniques.map((t) => (
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
    </main>
  );
}
