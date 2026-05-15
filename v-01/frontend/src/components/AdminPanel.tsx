import { useState } from 'react';
import { Contract, isAddress } from 'ethers';

/**
 * ══════════════════════════════════════════════════════════════
 *  AdminPanel.tsx
 * ══════════════════════════════════════════════════════════════
 *  Panel exclusivo para el Owner. Permite empadronar votantes,
 *  abrir y cerrar la votación.
 */

interface AdminPanelProps {
  contract: Contract;
  electionState: number | null; // 0 = Created, 1 = Open, 2 = Closed
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function AdminPanel({ contract, electionState, onSuccess, onError }: AdminPanelProps) {
  const [voterInput, setVoterInput] = useState('');
  const [txPending, setTxPending] = useState(''); // Guarda qué acción está cargando

  /**
   * Empadronar votante (authorizeVoter)
   */
  const handleAuthorizeVoter = async () => {
    const address = voterInput.trim();
    if (!address) return;

    // Validación estricta con ethers.js
    if (!isAddress(address)) {
      onError('❌ Error: La dirección ingresada no es válida.');
      return;
    }

    setTxPending('authorize');
    try {
      const tx = await contract.authorizeVoter(address);
      await tx.wait(); // Esperar a que se mine la transacción
      onSuccess(`✅ Votante empadronado: ${address}`);
      setVoterInput(''); // Limpiamos el input
    } catch (err: unknown) {
      const error = err as { code?: number; reason?: string; message?: string };
      if (error.code === 4001) {
        onError('Transacción cancelada por el usuario.');
      } else {
        const reason = error.reason || error.message || 'Error desconocido';
        onError(`❌ Error al empadronar: ${reason}`);
      }
      console.error(err);
    } finally {
      setTxPending('');
    }
  };

  /**
   * Abrir Votación (openVoting)
   */
  const handleOpenVoting = async () => {
    setTxPending('open');
    try {
      const tx = await contract.openVoting();
      await tx.wait();
      onSuccess('✅ ¡Votación abierta exitosamente!');
    } catch (err: unknown) {
      const error = err as { code?: number; reason?: string; message?: string };
      if (error.code === 4001) {
        onError('Transacción cancelada por el usuario.');
      } else {
        const reason = error.reason || error.message || 'Error desconocido';
        onError(`❌ Error al abrir votación: ${reason}`);
      }
      console.error(err);
    } finally {
      setTxPending('');
    }
  };

  /**
   * Cerrar Votación (closeVoting)
   */
  const handleCloseVoting = async () => {
    setTxPending('close');
    try {
      const tx = await contract.closeVoting();
      await tx.wait();
      onSuccess('✅ Votación cerrada. Los resultados son finales.');
    } catch (err: unknown) {
      const error = err as { code?: number; reason?: string; message?: string };
      if (error.code === 4001) {
        onError('Transacción cancelada por el usuario.');
      } else {
        const reason = error.reason || error.message || 'Error desconocido';
        onError(`❌ Error al cerrar votación: ${reason}`);
      }
      console.error(err);
    } finally {
      setTxPending('');
    }
  };

  const isPrep = electionState === 0;
  const isOpen = electionState === 1;
  const isAnyTxPending = txPending !== '';

  return (
    <>
      {/* Panel: Empadronar Votante */}
      <div className="admin-panel" id="authorize-panel">
        <h3 className="admin-panel__title">
          <span className="admin-panel__title-icon">🪪</span>
          Empadronar Votante
        </h3>
        <p className="admin-panel__description">
          Ingresá la dirección pública (0x...) del votante a autorizar.
          Solo es posible durante la Preparación o mientras está Abierto.
        </p>
        <div className="admin-panel__input-group">
          <input
            type="text"
            className="admin-panel__input"
            placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
            value={voterInput}
            onChange={(e) => setVoterInput(e.target.value)}
            disabled={isAnyTxPending || (!isPrep && !isOpen)}
          />
          <button
            className="admin-panel__btn admin-panel__btn--primary"
            onClick={handleAuthorizeVoter}
            disabled={isAnyTxPending || !voterInput.trim() || (!isPrep && !isOpen)}
            type="button"
          >
            {txPending === 'authorize' ? '⏳ Cargando...' : '✅ Empadronar'}
          </button>
        </div>
      </div>

      {/* Panel: Control del Comicio */}
      <div className="admin-panel" id="election-control-panel">
        <h3 className="admin-panel__title">
          <span className="admin-panel__title-icon">⚙️</span>
          Control del Comicio
        </h3>
        <p className="admin-panel__description">
          Gestioná el ciclo de vida de la elección. 
          El cierre es <strong>irreversible</strong>.
        </p>
        <div className="admin-panel__actions">
          <button
            className="admin-panel__btn admin-panel__btn--open"
            onClick={handleOpenVoting}
            disabled={isAnyTxPending || !isPrep} // Solo si está en preparación (0)
            type="button"
          >
            <span className="admin-panel__btn-icon">🟢</span>
            {txPending === 'open' ? 'Cargando...' : 'Abrir Votación'}
          </button>
          
          <button
            className="admin-panel__btn admin-panel__btn--close"
            onClick={handleCloseVoting}
            disabled={isAnyTxPending || !isOpen} // Solo si está abierta (1)
            type="button"
          >
            <span className="admin-panel__btn-icon">🔴</span>
            {txPending === 'close' ? 'Cargando...' : 'Cerrar Votación'}
          </button>
        </div>
      </div>
    </>
  );
}
