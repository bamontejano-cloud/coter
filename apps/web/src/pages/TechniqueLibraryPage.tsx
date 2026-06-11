import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { TechniqueCard } from '../components/TechniqueCard';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Technique {
  id: string;
  title: string;
  description: string;
  category: string;
  patientInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export function TechniqueLibraryPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: techniques, isLoading, error } = useQuery<Technique[]>({
    queryKey: ['techniques', categoryFilter],
    queryFn: async () => {
      const url = new URL(`${API_BASE}/techniques`);
      if (categoryFilter) url.searchParams.set('category', categoryFilter);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar técnicas');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/techniques/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al eliminar técnica');
    },
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
