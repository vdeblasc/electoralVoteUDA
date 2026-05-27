import { useState } from 'react';
import type { FormEvent } from 'react';
import { Contract, isAddress } from 'ethers';
import { getHumanError, shortenAddress } from '../utils/transactionMessages';

interface AdminPanelProps {
  contract: Contract;
  electionState: number | null;
  candidateCount: number;
  totalRegisteredVoters: number;
  totalVotes: number;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type AdminAction = 'candidate' | 'authorize' | 'open' | 'close' | null;

export default function AdminPanel({
  contract,
  electionState,
  candidateCount,
  totalRegisteredVoters,
  totalVotes,
  onSuccess,
  onError,
}: AdminPanelProps) {
  const [voterInput, setVoterInput] = useState('');
  const [txPending, setTxPending] = useState<AdminAction>(null);
  const [txStage, setTxStage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [listName, setListName] = useState('');
  const [position, setPosition] = useState('');

  const isPrep = electionState === 0;
  const isOpen = electionState === 1;
  const isClosed = electionState === 2;
  const isAnyTxPending = txPending !== null;

  const clearCandidateForm = () => {
    setFirstName('');
    setLastName('');
    setListName('');
    setPosition('');
  };

  const runAdminTx = async (action: Exclude<AdminAction, null>, callback: () => Promise<{ wait: () => Promise<unknown> }>, successMessage: string, fallbackError: string) => {
    setTxPending(action);
    setTxStage('Esperando confirmación en MetaMask…');
    try {
      const tx = await callback();
      setTxStage('Transacción enviada. Esperando que Hardhat mine el bloque…');
      await tx.wait();
      onSuccess(successMessage);
    } catch (err: unknown) {
      onError(getHumanError(err, fallbackError));
      console.error(err);
    } finally {
      setTxPending(null);
      setTxStage('');
    }
  };

  const handleAddCandidate = async (e: FormEvent) => {
    e.preventDefault();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanListName = listName.trim();
    const cleanPosition = position.trim();

    if (!cleanFirstName || !cleanLastName || !cleanListName || !cleanPosition) {
      onError('Completá nombre, apellido, lista y cargo antes de registrar al candidato.');
      return;
    }

    await runAdminTx(
      'candidate',
      () => contract.addCandidate(cleanFirstName, cleanLastName, cleanListName, cleanPosition),
      `Candidato registrado: ${cleanFirstName} ${cleanLastName}. Ya aparece en la boleta digital.`,
      'No pudimos registrar al candidato. Revisá que la elección siga en preparación.'
    );
    clearCandidateForm();
  };

  const handleAuthorizeVoter = async () => {
    const address = voterInput.trim();
    if (!address) return;

    if (!isAddress(address)) {
      onError('La dirección ingresada no tiene formato Ethereum válido. Debe empezar con 0x y tener 42 caracteres.');
      return;
    }

    await runAdminTx(
      'authorize',
      () => contract.authorizeVoter(address),
      `Votante empadronado: ${shortenAddress(address)}. Esa billetera ya puede votar cuando el comicio esté abierto.`,
      'No pudimos empadronar ese votante. Verificá que no esté repetido y que la elección no esté cerrada.'
    );
    setVoterInput('');
  };

  const handleOpenVoting = async () => {
    await runAdminTx(
      'open',
      () => contract.openVoting(),
      'Votación abierta. Los votantes habilitados ya pueden emitir su voto desde MetaMask.',
      'No pudimos abrir la votación. Recordá que debe existir al menos un candidato registrado.'
    );
  };

  const handleCloseVoting = async () => {
    const confirmed = window.confirm('Cerrar la votación es irreversible. ¿Confirmás que querés finalizar el comicio y congelar resultados?');
    if (!confirmed) return;

    await runAdminTx(
      'close',
      () => contract.closeVoting(),
      'Votación cerrada. Los resultados quedaron congelados en el contrato.',
      'No pudimos cerrar la votación. Verificá que el comicio esté abierto.'
    );
  };

  return (
    <div className="admin-console" aria-label="Panel de administrador">
      <section className="section-card section-card--admin">
        <div className="section-card__header">
          <div>
            <p className="eyebrow">Administrador electoral</p>
            <h3>Centro de control</h3>
            <p>Todo cambio sensible se firma en MetaMask y queda registrado en la red local.</p>
          </div>
        </div>

        <div className="admin-stats" aria-label="Resumen administrativo">
          <div><span>Candidatos</span><strong>{candidateCount}</strong></div>
          <div><span>Empadronados</span><strong>{totalRegisteredVoters}</strong></div>
          <div><span>Votos emitidos</span><strong>{totalVotes}</strong></div>
        </div>

        {txStage && (
          <div className="tx-inline" role="status">
            <span className="tx-inline__spinner" />
            {txStage}
          </div>
        )}
      </section>

      <section className="section-card">
        <div className="section-card__header">
          <div>
            <p className="eyebrow">Paso 1</p>
            <h3>Armar boleta</h3>
            <p>Registrá candidatos antes de abrir el comicio. Luego la boleta queda bloqueada.</p>
          </div>
          <span className={`state-pill ${isPrep ? 'state-pill--active' : ''}`}>{isPrep ? 'Disponible' : 'Bloqueado'}</span>
        </div>

        {isPrep ? (
          <form className="admin-form" onSubmit={handleAddCandidate}>
            <label>
              Nombre
              <input type="text" placeholder="Ej: Valentina" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isAnyTxPending} />
            </label>
            <label>
              Apellido
              <input type="text" placeholder="Ej: Rivera" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isAnyTxPending} />
            </label>
            <label>
              Lista / agrupación
              <input type="text" placeholder="Ej: Lista Horizonte" value={listName} onChange={e => setListName(e.target.value)} disabled={isAnyTxPending} />
            </label>
            <label>
              Cargo
              <input type="text" placeholder="Ej: Presidente del centro" value={position} onChange={e => setPosition(e.target.value)} disabled={isAnyTxPending} />
            </label>
            <button className="primary-action" type="submit" disabled={isAnyTxPending}>
              {txPending === 'candidate' ? 'Registrando candidato…' : 'Agregar a la boleta'}
            </button>
          </form>
        ) : (
          <div className="empty-state empty-state--compact">
            <strong>Boleta cerrada para edición</strong>
            <p>Cuando la elección está abierta o finalizada, el contrato no permite agregar candidatos nuevos.</p>
          </div>
        )}
      </section>

      <section className="section-card">
        <div className="section-card__header">
          <div>
            <p className="eyebrow">Paso 2</p>
            <h3>Empadronar votante</h3>
            <p>Ingresá la wallet del votante. Puede hacerse en preparación o con la votación abierta.</p>
          </div>
          <span className={`state-pill ${!isClosed ? 'state-pill--active' : ''}`}>{isClosed ? 'Cerrado' : 'Disponible'}</span>
        </div>

        <div className="admin-address-row">
          <input
            type="text"
            placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
            value={voterInput}
            onChange={(e) => setVoterInput(e.target.value)}
            disabled={isAnyTxPending || isClosed}
            aria-label="Dirección de billetera del votante"
          />
          <button className="secondary-action" onClick={handleAuthorizeVoter} disabled={isAnyTxPending || !voterInput.trim() || isClosed} type="button">
            {txPending === 'authorize' ? 'Empadronando…' : 'Autorizar wallet'}
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-card__header">
          <div>
            <p className="eyebrow">Paso 3</p>
            <h3>Ciclo del comicio</h3>
            <p>Abrí la votación cuando la boleta esté lista. Cerrarla congela resultados de forma irreversible.</p>
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-action admin-action--open" onClick={handleOpenVoting} disabled={isAnyTxPending || !isPrep} type="button">
            <span>Activar urna</span>
            <strong>{txPending === 'open' ? 'Abriendo…' : 'Abrir votación'}</strong>
          </button>
          <button className="admin-action admin-action--close" onClick={handleCloseVoting} disabled={isAnyTxPending || !isOpen} type="button">
            <span>Cierre irreversible</span>
            <strong>{txPending === 'close' ? 'Cerrando…' : 'Cerrar comicio'}</strong>
          </button>
        </div>
      </section>
    </div>
  );
}
