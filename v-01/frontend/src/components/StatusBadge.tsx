import './components.css'; // Asumimos un archivo CSS para los componentes

/**
 * ══════════════════════════════════════════════════════════════
 *  StatusBadge.tsx
 * ══════════════════════════════════════════════════════════════
 *  Muestra visualmente el estado del comicio (Created, Open, Closed)
 *  usando colores semánticos.
 */

interface StatusBadgeProps {
  status: number | null; // 0 = Created, 1 = Open, 2 = Closed
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === null) return null;

  let label = '';
  let className = 'badge';

  switch (status) {
    case 0:
      label = 'PREPARACIÓN';
      className += ' badge--prep';
      break;
    case 1:
      label = 'ABIERTO';
      className += ' badge--open';
      break;
    case 2:
      label = 'FINALIZADO';
      className += ' badge--closed';
      break;
    default:
      label = 'DESCONOCIDO';
      className += ' badge--unknown';
  }

  return (
    <div className={className}>
      <span className="badge__dot"></span>
      {label}
    </div>
  );
}
