import { useState, FormEvent, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { MessageBubble } from '../components/MessageBubble';
import { Icon } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { ChatMessage } from '@coterapeuta/shared';

/**
 * Single conversation thread. Polls every 10s so the other party's reply
 * surfaces without a manual refresh. The form is sticky at the bottom so
 * the user can keep typing while watching incoming messages.
 */
export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get<ChatMessage[]>(`/messages/${conversationId}`),
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.post<ChatMessage>('/messages', { conversationId, content: text }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: Error) => setSendError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSendError(null);
    if (!content.trim()) { setSendError('El mensaje no puede estar vacío'); return; }
    sendMutation.mutate(content);
  }

  return (
    <div className="conversation">
      <Card padding="sm" className="conversation__header" aria-label="Encabezado de conversación">
        <Button
          variant="ghost"
          className="conversation__back"
          onClick={() => navigate('/messages')}
          aria-label="Volver a mensajes"
        >
          <Icon name="ChevronLeft" size="sm" />
          Mensajes
        </Button>
        <div className="conversation__head-info">
          <span className="conversation__head-avatar" aria-hidden="true">
            <Icon name="MessageSquare" size="md" />
          </span>
          <div className="conversation__head-text">
            <h1 className="conversation__head-title">Conversación</h1>
            <p className="conversation__head-subtitle">
              ID <code>{conversationId ?? '—'}</code>
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md" className="conversation__thread" aria-label="Mensajes de la conversación">
        {isLoading && (
          <div className="page-state">
            <Spinner size="lg" label="Cargando mensajes…" />
            <p className="page-state__hint">Cargando mensajes…</p>
          </div>
        )}

        {!isLoading && messages && messages.length === 0 && (
          <EmptyState
            icon="MessageSquare"
            title="Sin mensajes todavía"
            description="Enviá el primero abajo para abrir la conversación."
          />
        )}

        {messages && messages.length > 0 && (
          <div className="conversation__messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                sentAt={msg.sentAt}
                isMine={msg.senderId === user?.id}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </Card>

      <form
        onSubmit={handleSubmit}
        className="conversation__form"
        aria-label="Enviar mensaje"
      >
        {sendError && (
          <Alert variant="danger" title="No se pudo enviar el mensaje">
            {sendError}
          </Alert>
        )}
        <div className="conversation__form-row">
          <Input
            id="message-input"
            label="Nuevo mensaje"
            hideLabel
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí un mensaje…"
          />
          <Button type="submit" variant="primary" isLoading={sendMutation.isPending}>
            <Icon name="Send" size="sm" />
            {sendMutation.isPending ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
