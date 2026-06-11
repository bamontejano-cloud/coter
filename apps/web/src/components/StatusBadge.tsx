interface StatusBadgeProps {
  status: 'pending' | 'completed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isPending = status === 'pending';
  return (
    <span
      role="status"
      aria-label={isPending ? 'Pendiente' : 'Completada'}
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '0.25rem',
        backgroundColor: isPending ? '#fff3cd' : '#d1fae5',
        color: isPending ? '#856404' : '#065f46',
        fontWeight: 'bold',
        fontSize: '0.85rem',
      }}
    >
      {isPending ? 'Pendiente' : 'Completada'}
    </span>
  );
}
