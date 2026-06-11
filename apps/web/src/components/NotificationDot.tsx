interface NotificationDotProps {
  count: number;
}

export function NotificationDot({ count }: NotificationDotProps) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} notificaciones sin leer`}
      style={{
        display: 'inline-block',
        width: '0.6rem',
        height: '0.6rem',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        marginLeft: '0.3rem',
        verticalAlign: 'middle',
      }}
    />
  );
}
