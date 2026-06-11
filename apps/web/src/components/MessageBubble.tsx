interface MessageBubbleProps {
  content: string;
  sentAt: string;
  isMine: boolean;
}

export function MessageBubble({ content, sentAt, isMine }: MessageBubbleProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        marginBottom: '0.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '70%', padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem',
          backgroundColor: isMine ? '#3b82f6' : '#f3f4f6',
          color: isMine ? 'white' : '#111827',
        }}
        aria-label={isMine ? 'Mensaje enviado' : 'Mensaje recibido'}
      >
        {content}
      </div>
      <time style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.2rem' }}>
        {new Date(sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
  );
}
