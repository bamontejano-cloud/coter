import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Icon, IconName } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { Technique } from '@coterapeuta/shared';

interface TechniqueFormData {
  title: string;
  description: string;
  category: string;
  patientInstructions: string;
}

/**
 * Create or edit form for a technique. Same layout for both — the only
 * difference is the heading copy, the seeded form values, and the mutation
 * verb (POST vs PUT). All fields use our Input/Textarea primitives so the
 * a11y wiring is consistent with Login/Register.
 */
export function TechniqueFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<TechniqueFormData>({
    title: '',
    description: '',
    category: '',
    patientInstructions: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery<Technique | null>({
    queryKey: ['technique', id],
    queryFn: async () => {
      const all = await api.get<Technique[]>('/techniques');
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
    mutationFn: (data: TechniqueFormData) => {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        patientInstructions: data.patientInstructions || undefined,
      };
      return isEdit
        ? api.put<Technique>(`/techniques/${id}`, payload)
        : api.post<Technique>('/techniques', payload);
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
    <div className="page-stack">
      <Button
        variant="ghost"
        className="page-back-link"
        onClick={() => navigate('/library')}
      >
        <Icon name="ChevronLeft" size="sm" />
        Volver a la biblioteca
      </Button>

      <Card
        padding="lg"
        className="technique-form-card"
        aria-label={isEdit ? 'Formulario de edición de técnica' : 'Formulario de nueva técnica'}
      >
        <header className="technique-form-card__heading">
          <p className="technique-form-card__eyebrow">
            <Icon name={isEdit ? 'Edit' : 'Plus'} size="xs" />{' '}
            {isEdit ? 'Editar técnica' : 'Nueva técnica'}
          </p>
          <h1 className="technique-form-card__title">
            {isEdit ? `Editar: ${form.title || '…'}` : 'Crea una nueva técnica'}
          </h1>
          <p className="technique-form-card__subtitle">
            Definí cómo se llama, en qué consiste y qué instrucciones verá el paciente
            cuando se la asignes.
          </p>
        </header>

        {error && (
          <div className="technique-form-card__alert">
            <Alert variant="danger" title="No se pudo guardar la técnica">
              {error}
            </Alert>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="technique-form-card__form"
          aria-label={isEdit ? 'Formulario de edición de técnica' : 'Formulario de nueva técnica'}
        >
          <Input
            label="Título"
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            maxLength={120}
            placeholder="Ej.: Respiración diafragmática 4-7-8"
            hint={`${form.title.length}/120 caracteres`}
          />

          <Textarea
            label="Descripción"
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={4}
            placeholder="Qué técnica es, por qué funciona, en qué situaciones sirve."
          />

          <Input
            label="Categoría"
            id="category"
            type="text"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
            placeholder="Ej.: Respiración, Mindfulness, Journaling…"
            hint="Las categorías te permiten filtrar la biblioteca."
          />

          <Textarea
            label="Instrucciones para el paciente (opcional)"
            id="patientInstructions"
            value={form.patientInstructions}
            onChange={(e) => setForm((f) => ({ ...f, patientInstructions: e.target.value }))}
            rows={5}
            placeholder="Pasos concretos, frecuencia sugerida, señales de alarma."
            hint="Lo verá sólo cuando le asignes esta técnica."
          />

          <div className="technique-form-card__actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/library')}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={mutation.isPending}
            >
              <Icon name="Save" size="sm" />
              {mutation.isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear técnica'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Re-export so other pages can keep using the IconName type.
export type { IconName };
