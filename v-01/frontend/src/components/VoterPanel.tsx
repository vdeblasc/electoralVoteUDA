import { useMemo, useState } from 'react';
import { Contract } from 'ethers';
import { getHumanError } from '../utils/transactionMessages';

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

function candidateName(candidate: Candidate) {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

function initials(candidate: Candidate) {
  const first = candidate.firstName?.[0] ?? '';
  const last = candidate.lastName?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '??';
}

export default function VoterPanel({
  contract,
  electionState,
  candidates,
  isAuthorized,
  hasVoted,
  onSuccess,
  onError,
}: VoterPanelProps) {
  const [votingForId, setVotingForId] = useState<number | null>(null);
  const [txStage, setTxStage] = useState('');

  const isOpen = electionState === 1;
  const isPrep = electionState === 0;
  const isClosed = electionState === 2;

  const winners = useMemo(() => {
    if (!isClosed || candidates.length === 0) return [];
    const maxVotes = Math.max(...candidates.map(candidate => candidate.voteCount));
    if (maxVotes === 0) return [];
    return candidates.filter(candidate => candidate.voteCount === maxVotes);
  }, [candidates, isClosed]);

  const handleVote = async (id: number) => {
    setVotingForId(id);
    setTxStage('Confirmá tu voto en MetaMask…');
    try {
      const tx = await contract.vote(id);
      setTxStage('Voto enviado. Esperando confirmación del bloque…');
      await tx.wait();
      onSuccess('Voto registrado. Tu billetera quedó marcada como votada y el conteo se actualizó en blockchain.');
    } catch (err: unknown) {
      onError(getHumanError(err, 'No pudimos registrar el voto. Revisá el estado de la elección y volvé a intentarlo.'));
      console.error(err);
    } finally {
      setVotingForId(null);
      setTxStage('');
    }
  };

  if (!isAuthorized) {
    return (
      <section className="section-card voter-access-card" aria-label="Estado de padrón">
        <div className="voter-access-card__mark">!</div>
        <div>
          <p className="eyebrow">Padrón electoral</p>
          <h3>Tu wallet aún no está habilitada</h3>
          <p>Para votar, el administrador debe empadronar esta dirección pública. No hace falta compartir tu clave privada.</p>
          <div className="voter-access-card__steps">
            <span>1. Copiá tu dirección de MetaMask</span>
            <span>2. Pedí autorización al administrador</span>
            <span>3. Volvé a actualizar la app</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="voter-panel" aria-labelledby="voter-title">
      <div className="section-card section-card--voter-intro">
        <div className="section-card__header">
          <div>
            <p className="eyebrow">Votante habilitado</p>
            <h3 id="voter-title">{isClosed ? 'Resultados finales' : 'Boleta digital'}</h3>
            <p>
              {hasVoted
                ? 'Tu voto ya fue registrado. Podés revisar resultados agregados, pero no votar otra vez.'
                : isOpen
                  ? 'Elegí un candidato y confirmá la transacción en MetaMask. Solo se permite un voto por wallet.'
                  : isPrep
                    ? 'La boleta está preparada, pero la votación todavía no fue abierta por el administrador.'
                    : 'El comicio terminó. Los resultados quedaron congelados en el contrato.'}
            </p>
          </div>
          <span className={`state-pill ${hasVoted ? 'state-pill--success' : isOpen ? 'state-pill--active' : ''}`}>
            {hasVoted ? 'Voto emitido' : isOpen ? 'Podés votar' : isPrep ? 'En espera' : 'Finalizado'}
          </span>
        </div>

        {txStage && (
          <div className="tx-inline" role="status">
            <span className="tx-inline__spinner" />
            {txStage}
          </div>
        )}
      </div>

      {isClosed && (
        <div className="winner-banner" role="status">
          <span className="winner-banner__icon">◆</span>
          <div>
            <p className="eyebrow">Acta de cierre</p>
            {winners.length === 0 ? (
              <h3>La elección cerró sin votos emitidos.</h3>
            ) : winners.length === 1 ? (
              <h3>Ganador: {candidateName(winners[0])}</h3>
            ) : (
              <h3>Empate técnico entre {winners.length} candidatos</h3>
            )}
            {winners.length > 0 && (
              <p>{winners.map(candidate => `${candidateName(candidate)} (${candidate.listName})`).join(' · ')} con {winners[0].voteCount} voto{winners[0].voteCount === 1 ? '' : 's'}.</p>
            )}
          </div>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="empty-state">
          <strong>Todavía no hay candidatos cargados</strong>
          <p>Cuando el administrador registre la boleta, los nombres aparecerán acá automáticamente.</p>
        </div>
      ) : (
        <div className="candidates-grid" aria-label="Lista de candidatos">
          {candidates.map((candidate) => {
            const disabled = !isOpen || hasVoted || votingForId !== null;
            const buttonLabel = votingForId === candidate.id
              ? 'Procesando voto…'
              : hasVoted
                ? 'Voto ya emitido'
                : !isOpen
                  ? (isPrep ? 'Aún no abre' : 'Comicio cerrado')
                  : 'Votar por esta opción';

            return (
              <article key={candidate.id} className="candidate-card">
                <div className="candidate-card__header">
                  <span className="candidate-card__avatar" aria-hidden="true">{initials(candidate)}</span>
                  <span className="candidate-card__id">ID #{candidate.id}</span>
                </div>
                <div className="candidate-card__info">
                  <h4 className="candidate-card__name">{candidateName(candidate)}</h4>
                  <div className="candidate-card__tags">
                    <span>{candidate.listName}</span>
                    <span>{candidate.position}</span>
                  </div>
                  <p className="candidate-card__explain">Seleccionar esta opción abrirá MetaMask para firmar una transacción de voto.</p>
                </div>
                <div className="candidate-card__footer">
                  <div className="candidate-card__votes"><strong>{candidate.voteCount}</strong><span>votos</span></div>
                  <button className="candidate-card__btn" onClick={() => handleVote(candidate.id)} disabled={disabled} type="button">
                    {buttonLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
