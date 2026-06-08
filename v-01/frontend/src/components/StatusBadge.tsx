import './components.css';

interface StatusBadgeProps {
  status: number | null;
}

const STATUS_COPY: Record<number, { label: string; className: string }> = {
  0: { label: 'Preparación', className: 'badge--prep' },
  1: { label: 'Abierto', className: 'badge--open' },
  2: { label: 'Finalizado', className: 'badge--closed' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === null) return <div className="badge badge--unknown">Sin estado</div>;

  const current = STATUS_COPY[status] ?? { label: 'Desconocido', className: 'badge--unknown' };

  return (
    <div className={`badge ${current.className}`} aria-label={`Estado del comicio: ${current.label}`}>
      <span className="badge__dot" aria-hidden="true" />
      {current.label}
    </div>
  );
}
