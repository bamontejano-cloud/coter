import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UnreadBadge } from '../components/UnreadBadge';
import { api } from '../lib/apiClient';
import type { ConversationSummary } from '@coterapeuta/shared';

export function MessagesListPage() {
  const { data: conversations, isLoading, error } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get<ConversationSummary[]>('/messages/conversations'),
    refetchInterval: 30_000,
  });

  return (
    <main>
      <h1>Mensajes</h1>
      {isLoading && <p>Cargando conversaciones…</p>}
      {error && <p role="alert" style={{ color: 'red' }}>Error al cargar conversaciones</p>}
      {conversations && conversations.length === 0 && <p>No tienes conversaciones todavía.</p>}
      {conversations && (
        <ul aria-label="Lista de conversaciones">
          {conversations.map((conv) => (
            <li key={conv.conversationId} style={{ marginBottom: '1rem', listStyle: 'none' }}>
              <Link to={`/messages/${conv.conversationId}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Conversación</span>
                  <UnreadBadge count={conv.unreadCount} />
                </div>
                {conv.lastMessage && (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                    {conv.lastMessage.content}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
