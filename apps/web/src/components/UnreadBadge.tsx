interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} mensajes no leídos`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '1.5rem', height: '1.5rem', borderRadius: '50%',
        backgroundColor: '#dc2626', color: 'white',
        fontSize: '0.75rem', fontWeight: 'bold', padding: '0 0.3rem',
      }}
    >
      {count}
    </span>
  );
}
