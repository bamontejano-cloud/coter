import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { UnreadBadge } from '../components/UnreadBadge';
import { Icon } from '../components/ui/Icon';
import { api } from '../lib/apiClient';
import type { ConversationSummary } from '@coterapeuta/shared';

/**
 * Conversation list. Each row links to its detail page. The list auto-polls
 * every 30s so the unread badge stays fresh without a manual refresh.
 *
 * Visual notes:
 *  - The "avatar" is a chat-bubble icon — we don't have a reliable
 *    participant name field to derive initials from on this row, so we
 *    stroke the icon at a gradient backdrop so each row looks like a
 *    "person" without lying about whose it is.
 */
export function MessagesListPage() {
  const navigate = useNavigate();

  const { data: conversations, isLoading, error } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get<ConversationSummary[]>('/messages/conversations'),
    refetchInterval: 30_000,
  });

  return (
    <div className="page-stack">
      <Card padding="lg" className="messages-list-header" aria-label="Mensajes">
        <p className="messages-list-header__eyebrow">
          <Icon name="MessageSquare" size="xs" /> Mensajes
        </p>
        <h1 className="messages-list-header__title">Mensajes</h1>
        <p className="messages-list-header__subtitle">
          Todas tus conversaciones con pacientes y terapeutas en un solo lugar.
        </p>
      </Card>

      {error && (
        <Alert variant="danger" title="No se pudieron cargar las conversaciones">
          Verificá tu conexión e intentá nuevamente.
        </Alert>
      )}

      {isLoading && (
        <div className="page-state">
          <Spinner size="lg" label="Cargando conversaciones…" />
          <p className="page-state__hint">Cargando conversaciones…</p>
        </div>
      )}

      {conversations && conversations.length === 0 && !isLoading && (
        <EmptyState
          icon="MessageSquare"
          title="Todavía no tenés conversaciones"
          description="Cuando un paciente o terapeuta te escriba, aparecerá acá."
        />
      )}

      {conversations && conversations.length > 0 && (
        <Card padding="sm" aria-label="Lista de conversaciones">
          <ul className="messages-list">
            {conversations.map((conv) => (
              <li key={conv.conversationId}>
                <button
                  type="button"
                  className="messages-list__row"
                  onClick={() => navigate(`/messages/${conv.conversationId}`)}
                  aria-label={`Abrir conversación${conv.unreadCount > 0 ? ` (${conv.unreadCount} sin leer)` : ''}`}
                >
                  <span className="messages-list__avatar" aria-hidden="true">
                    <Icon name="MessageSquare" size="md" />
                  </span>
                  <span className="messages-list__main">
                    <span className="messages-list__title">
                      <span>Conversación</span>
                      {conv.unreadCount > 0 && <UnreadBadge count={conv.unreadCount} />}
                    </span>
                    {conv.lastMessage && (
                      <span className="messages-list__preview">
                        {conv.lastMessage.content}
                      </span>
                    )}
                    {conv.lastMessage && (
                      <span className="messages-list__time">
                        <time dateTime={conv.lastMessage.sentAt}>
                          {new Date(conv.lastMessage.sentAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </span>
                    )}
                  </span>
                  <span className="messages-list__chevron" aria-hidden="true">
                    <Icon name="ChevronRight" size="sm" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
