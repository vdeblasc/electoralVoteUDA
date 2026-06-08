import { useMemo } from 'react';
import type { Candidate } from './VoterPanel';
import StatusBadge from './StatusBadge';

interface ResultsPanelProps {
  candidates: Candidate[];
  totalVotes: number;
  totalRegisteredVoters: number;
  electionState: number | null;
}

function candidateName(candidate: Candidate) {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

export default function ResultsPanel({
  candidates,
  totalVotes,
  totalRegisteredVoters,
  electionState,
}: ResultsPanelProps) {
  const sortedResults = useMemo(
    () => [...candidates].sort((a, b) => b.voteCount - a.voteCount || candidateName(a).localeCompare(candidateName(b))),
    [candidates]
  );

  const participation = totalRegisteredVoters > 0
    ? Math.round((totalVotes * 10000) / totalRegisteredVoters) / 100
    : 0;

  return (
    <section className="results-panel" aria-labelledby="results-title">
      <div className="results-panel__header">
        <div>
          <p className="eyebrow">Transparencia pública</p>
          <h3 id="results-title" className="results-panel__title">Resultados</h3>
          <p className="results-panel__description">
            Conteo agregado leído del contrato. No revela qué votó cada persona.
          </p>
        </div>
        <StatusBadge status={electionState} />
      </div>

      <div className="results-summary">
        <div className="results-summary__card">
          <span>Total votos</span>
          <strong>{totalVotes}</strong>
        </div>
        <div className="results-summary__card">
          <span>Padrón</span>
          <strong>{totalRegisteredVoters}</strong>
        </div>
        <div className="results-summary__card">
          <span>Participación</span>
          <strong>{participation}%</strong>
        </div>
      </div>

      {sortedResults.length === 0 ? (
        <div className="results-panel__empty">
          <strong>Sin boleta cargada</strong>
          <span>Los resultados aparecerán cuando existan candidatos.</span>
        </div>
      ) : (
        <div className="results-list">
          {sortedResults.map((candidate, index) => {
            const percent = totalVotes > 0
              ? Math.round((candidate.voteCount * 10000) / totalVotes) / 100
              : 0;

            return (
              <article className="result-row" key={candidate.id}>
                <div className="result-row__rank">#{index + 1}</div>
                <div className="result-row__content">
                  <div className="result-row__topline">
                    <strong>{candidateName(candidate)}</strong>
                    <span>{candidate.voteCount} · {percent}%</span>
                  </div>
                  <small>{candidate.listName} · {candidate.position}</small>
                  <div className="result-row__bar" aria-hidden="true">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
