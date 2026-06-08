export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getElectionStateLabel(status: number | null): string {
  switch (status) {
    case 0:
      return 'Preparación';
    case 1:
      return 'Votación abierta';
    case 2:
      return 'Finalizado';
    default:
      return 'Sin conectar';
  }
}

type EthersLikeError = {
  code?: number | string;
  reason?: string;
  shortMessage?: string;
  message?: string;
  info?: {
    error?: {
      message?: string;
    };
  };
};

const CONTRACT_ERROR_COPY: Array<[string, string]> = [
  ['Solo el administrador puede realizar esta accion', 'Esta acción solo puede hacerla la cuenta administradora que desplegó el contrato.'],
  ['El comicio no esta en el estado correcto', 'La elección no está en la etapa correcta para esta acción. Revisá el estado actual del comicio.'],
  ['Debe haber al menos un candidato', 'Agregá al menos un candidato antes de abrir la votación.'],
  ['No estas en el padron', 'Tu billetera todavía no está empadronada. Pedile al administrador que autorice tu dirección.'],
  ['Ya has emitido tu voto', 'Esta billetera ya registró su voto. Por seguridad, solo se permite un voto por dirección.'],
  ['Candidato invalido', 'El candidato seleccionado no existe o la lista cambió. Actualizá la página e intentá de nuevo.'],
  ['Direccion invalida', 'La dirección ingresada no parece ser una wallet válida de Ethereum.'],
  ['El votante ya esta autorizado', 'Ese votante ya está dentro del padrón electoral.'],
  ['No se pueden registrar votantes con el comicio cerrado', 'El comicio ya está cerrado, por eso no se pueden agregar nuevos votantes.'],
  ['El nombre del candidato no puede estar vacio', 'El nombre del candidato es obligatorio.'],
  ['El apellido del candidato no puede estar vacio', 'El apellido del candidato es obligatorio.'],
];

function extractRawError(error: unknown): string {
  const err = error as EthersLikeError;
  return [err.reason, err.shortMessage, err.info?.error?.message, err.message]
    .filter(Boolean)
    .join(' · ');
}

export function getHumanError(error: unknown, fallback: string): string {
  const err = error as EthersLikeError;

  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Operación cancelada. No se hizo ningún cambio porque rechazaste la confirmación en MetaMask.';
  }

  const raw = extractRawError(error);
  const known = CONTRACT_ERROR_COPY.find(([needle]) => raw.includes(needle));

  if (known) return known[1];
  if (raw.toLowerCase().includes('insufficient funds')) {
    return 'La cuenta no tiene ETH de prueba suficiente para pagar el gas. Importá una cuenta de Hardhat o reiniciá el nodo local.';
  }
  if (raw.toLowerCase().includes('could not coalesce error')) {
    return 'MetaMask devolvió un error inesperado. Revisá que el nodo Hardhat esté corriendo y que estés en la red correcta.';
  }

  return fallback;
}
