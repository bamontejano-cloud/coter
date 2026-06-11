import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface TechniqueFormData {
  title: string;
  description: string;
  category: string;
  patientInstructions: string;
}

interface Technique {
  id: string;
  title: string;
  description: string;
  category: string;
  patientInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export function TechniqueFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<TechniqueFormData>({
    title: '',
    description: '',
    category: '',
    patientInstructions: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Load existing technique when editing
  const { data: existing } = useQuery<Technique | null>({
    queryKey: ['technique', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/techniques`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar técnicas');
      const all: Technique[] = await res.json();
      return all.find((t) => t.id === id) ?? null;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        category: existing.category,
        patientInstructions: existing.patientInstructions ?? '',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async (data: TechniqueFormData) => {
      const url = isEdit ? `${API_BASE}/techniques/${id}` : `${API_BASE}/techniques`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category: data.category,
          patientInstructions: data.patientInstructions || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Error al guardar técnica');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] });
      navigate('/library');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    if (!form.description.trim()) { setError('La descripción es obligatoria'); return; }
    if (!form.category.trim()) { setError('La categoría es obligatoria'); return; }
    mutation.mutate(form);
  }

  return (
    <main>
      <h1>{isEdit ? 'Editar técnica' : 'Nueva técnica'}</h1>
      <form onSubmit={handleSubmit} aria-label={isEdit ? 'Formulario de edición de técnica' : 'Formulario de nueva técnica'}>
        {error && <p role="alert" aria-live="assertive" style={{ color: 'red' }}>{error}</p>}
        <div>
          <label htmlFor="title">Título (máx. 120 caracteres)</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="category">Categoría</label>
          <input
            id="category"
            type="text"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="patientInstructions">Instrucciones para el paciente (opcional)</label>
          <textarea
            id="patientInstructions"
            value={form.patientInstructions}
            onChange={e => setForm(f => ({ ...f, patientInstructions: e.target.value }))}
          />
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={() => navigate('/library')}>Cancelar</button>
      </form>
    </main>
  );
}
