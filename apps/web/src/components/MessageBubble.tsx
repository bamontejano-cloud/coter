interface MessageBubbleProps {
  content: string;
  sentAt: string;
  isMine: boolean;
}

/**
 * One bubble in a chat thread. Outgoing messages get a brand-tinted fill
 * aligned to the right; incoming get a neutral fill aligned to the left.
 * The wrapper groups bubble + timestamp so they sit together visually
 * regardless of width.
 *
 * Note: rendering uses class names only (no inline styles) so a future
 * dark-mode or themeable variant only needs new CSS.
 */
export function MessageBubble({ content, sentAt, isMine }: MessageBubbleProps) {
  const variantClass = isMine ? 'message-bubble--mine' : 'message-bubble--theirs';
  return (
    <div
      className={`message-bubble ${variantClass}`}
      aria-label={isMine ? 'Mensaje enviado' : 'Mensaje recibido'}
    >
      <p className="message-bubble__content">{content}</p>
      <time className="message-bubble__time" dateTime={sentAt}>
        {new Date(sentAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </time>
    </div>
  );
}
