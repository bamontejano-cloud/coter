import { useState, FormEvent, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { MessageBubble } from '../components/MessageBubble';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al cargar mensajes');
      return res.json();
    },
    enabled: !!conversationId,
    refetchInterval: 10_000, // poll every 10s
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Error al enviar mensaje');
      }
      return res.json();
    },
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
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header>
        <Link to="/messages">← Volver a mensajes</Link>
        <h1>Conversación</h1>
      </header>

      <section
        aria-label="Mensajes de la conversación"
        style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}
      >
        {isLoading && <p>Cargando mensajes…</p>}
        {messages?.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            sentAt={msg.sentAt}
            isMine={msg.senderId === user?.id}
          />
        ))}
        <div ref={bottomRef} />
      </section>

      <form
        onSubmit={handleSubmit}
        style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}
        aria-label="Enviar mensaje"
      >
        {sendError && <p role="alert" style={{ color: 'red', width: '100%' }}>{sendError}</p>}
        <label htmlFor="message-input" style={{ display: 'none' }}>Nuevo mensaje</label>
        <input
          id="message-input"
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje…"
          style={{ flex: 1 }}
          aria-label="Escribe tu mensaje"
        />
        <button type="submit" disabled={sendMutation.isPending}>
          {sendMutation.isPending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </main>
  );
}
