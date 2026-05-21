import { useState } from 'react';
import { Contract } from 'ethers';

/**
 * ══════════════════════════════════════════════════════════════
 *  VoterPanel.tsx
 * ══════════════════════════════════════════════════════════════
 *  Panel para los usuarios votantes. Muestra la lista de candidatos
 *  y permite emitir un voto si el comicio está abierto.
 */

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  listName: string;
  position: string;
  voteCount: number;
}

interface VoterPanelProps {
  contract: Contract;
  electionState: number | null;
  candidates: Candidate[];
  isAuthorized: boolean;
  hasVoted: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function VoterPanel({
  contract,
  electionState,
  candidates,
  isAuthorized,
  hasVoted,
  onSuccess,
  onError
}: VoterPanelProps) {
  const [votingForId, setVotingForId] = useState<number | null>(null);

  const handleVote = async (id: number) => {
    setVotingForId(id);
    try {
      const tx = await contract.vote(id);
      await tx.wait();
      onSuccess('✅ ¡Tu voto ha sido registrado exitosamente!');
    } catch (err: unknown) {
      const error = err as { code?: number; reason?: string; message?: string };
      if (error.code === 4001) {
        onError('Transacción cancelada por el usuario.');
      } else {
        // Captura errores del contrato como "Ya has emitido tu voto" o "No estas en el padron"
        const reason = error.reason || error.message || 'Error desconocido';
        onError(`❌ Error: ${reason}`);
      }
      console.error(err);
    } finally {
      setVotingForId(null);
    }
  };

  const isOpen = electionState === 1;
  const isPrep = electionState === 0;
  const isClosed = electionState === 2;

  let winnerContent = null;
  if (isClosed && candidates.length > 0) {
    const maxVotes = Math.max(...candidates.map(c => c.voteCount));
    const winners = candidates.filter(c => c.voteCount === maxVotes);

    winnerContent = (
      <div className="voter-panel__winner-banner" style={{ backgroundColor: '#08031aff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #91d5ff', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#ffffffff', margin: '0 0 1rem 0' }}>🏆 Resultados Finales</h3>
        {maxVotes === 0 ? (
          <p style={{ margin: 0, fontSize: '1.2rem' }}>Nadie recibió votos.</p>
        ) : winners.length === 1 ? (
          <p style={{ margin: 0, fontSize: '1.2rem' }}>
            El ganador es <strong>{winners[0].firstName} {winners[0].lastName}</strong> ({winners[0].listName}) con <strong>{maxVotes} votos</strong>.
          </p>
        ) : (
          <div style={{ margin: 0, fontSize: '1.2rem' }}>
            ¡Hay un empate! Los siguientes candidatos obtuvieron <strong>{maxVotes} votos</strong>:
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
              {winners.map(w => <li key={w.id}><strong>{w.firstName} {w.lastName}</strong> ({w.listName})</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Si no está empadronado, le avisamos
  if (!isAuthorized) {
    return (
      <div className="voter-warning">
        <span className="voter-warning__icon">⚠️</span>
        <div>
          <h3>No estás en el padrón</h3>
          <p>Tu dirección no está autorizada para votar. Contactá al administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voter-panel">
      <h3 className="voter-panel__title">{isClosed ? 'Resultados Finales' : 'Candidatos'}</h3>
      {winnerContent}
      {candidates.length === 0 ? (
        <p className="voter-panel__empty">Aún no hay candidatos registrados.</p>
      ) : (
        <div className="candidates-grid">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="candidate-card">
              <div className="candidate-card__info">
                <span className="candidate-card__id">#{candidate.id}</span>
                <h4 className="candidate-card__name">{candidate.firstName} {candidate.lastName}</h4>
                <div className="candidate-card__details" style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.5rem' }}>
                  <div><strong>Lista:</strong> {candidate.listName}</div>
                  <div><strong>Puesto:</strong> {candidate.position}</div>
                </div>
                <div className="candidate-card__votes">
                  <strong>{candidate.voteCount}</strong> votos
                </div>
              </div>

              <button
                className="candidate-card__btn"
                onClick={() => handleVote(candidate.id)}
                disabled={!isOpen || hasVoted || votingForId !== null}
              >
                {votingForId === candidate.id ? '⏳ Procesando...' :
                  hasVoted ? 'Ya votaste' :
                    !isOpen ? (isPrep ? 'Aún no abre' : 'Cerrado') :
                      '🗳️ Votar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
