import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { UnreadBadge } from '../components/UnreadBadge';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface ConversationSummary {
  conversationId: string;
  participantId: string;
  unreadCount: number;
  lastMessage?: { content: string; sentAt: string };
}

export function MessagesListPage() {
  const token = useAuthStore((s) => s.token);

  const { data: conversations, isLoading, error } = useQuery<ConversationSummary[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar conversaciones');
      return res.json();
    },
    refetchInterval: 30_000, // poll every 30s
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
