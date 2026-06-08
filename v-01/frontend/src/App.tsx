import { useState, useCallback, useEffect, useMemo } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import type { Signer } from 'ethers';

import './App.css';

import { CONTRACT_ADDRESS, VOTING_ABI } from './constants/contract';
import StatusBadge from './components/StatusBadge';
import AdminPanel from './components/AdminPanel';
import VoterPanel, { type Candidate } from './components/VoterPanel';
import ResultsPanel from './components/ResultsPanel';
import { getElectionStateLabel, getHumanError, shortenAddress } from './utils/transactionMessages';

const HARDHAT_CHAIN_ID = 31337n;
const HARDHAT_CHAIN_ID_HEX = '0x7A69';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const [contract, setContract] = useState<Contract | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [electionState, setElectionState] = useState<number | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalRegisteredVoters, setTotalRegisteredVoters] = useState(0);

  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = Boolean(
    address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase()
  );

  const progress = useMemo(() => {
    if (electionState === 2) return 100;
    if (electionState === 1) return 66;
    if (electionState === 0) return 33;
    return 0;
  }, [electionState]);

  const resetSession = () => {
    setAddress(null);
    setError(null);
    setWrongNetwork(false);
    setContractOwner(null);
    setContract(null);
    setElectionState(null);
    setIsAuthorized(false);
    setHasVoted(false);
    setCandidates([]);
    setTotalVotes(0);
    setTotalRegisteredVoters(0);
    setTxSuccess(null);
    setTxError(null);
  };

  const refreshData = useCallback(async (votingContract: Contract, userAddr: string) => {
    setIsRefreshing(true);
    try {
      const [ownerAddr, state, authorized, voted, results, votes, registered] = await Promise.all([
        votingContract.owner(),
        votingContract.electionState(),
        votingContract.isVoterAuthorized(userAddr),
        votingContract.hasVoterVoted(userAddr),
        votingContract.getAllResults(),
        votingContract.totalVotes(),
        votingContract.totalRegisteredVoters(),
      ]);

      const [firstNames, lastNames, listNames, positions, voteCounts] = results;
      const parsedCandidates: Candidate[] = firstNames.map((firstName: string, index: number) => ({
        id: index,
        firstName,
        lastName: lastNames[index],
        listName: listNames[index],
        position: positions[index],
        voteCount: Number(voteCounts[index]),
      }));

      setContractOwner(ownerAddr);
      setElectionState(Number(state));
      setIsAuthorized(Boolean(authorized));
      setHasVoted(Boolean(voted));
      setCandidates(parsedCandidates);
      setTotalVotes(Number(votes));
      setTotalRegisteredVoters(Number(registered));
    } catch (err) {
      console.error('Error al actualizar datos del contrato:', err);
      setTxError(getHumanError(err, 'No pudimos leer los datos del contrato. Revisá que el contrato esté desplegado y que la dirección de .env sea correcta.'));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const checkNetwork = useCallback(async (provider: BrowserProvider): Promise<boolean> => {
    try {
      const network = await provider.getNetwork();

      if (network.chainId !== HARDHAT_CHAIN_ID) {
        setWrongNetwork(true);
        setError(null);

        try {
          await window.ethereum!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
          });
          setWrongNetwork(false);
          return true;
        } catch {
          try {
            await window.ethereum!.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: HARDHAT_CHAIN_ID_HEX,
                chainName: 'Hardhat Local',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              }],
            });
            setWrongNetwork(false);
            return true;
          } catch {
            return false;
          }
        }
      }

      setWrongNetwork(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);
    setTxError(null);
    setIsConnecting(true);

    try {
      if (!window.ethereum) {
        setError('No detectamos MetaMask. Instalá la extensión, desbloqueala y recargá esta página para participar.');
        return;
      }

      if (!CONTRACT_ADDRESS) {
        setError('Falta VITE_CONTRACT_ADDRESS en frontend/.env. Desplegá el contrato y pegá ahí su dirección.');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer: Signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const isCorrectNetwork = await checkNetwork(provider);

      if (!isCorrectNetwork) {
        setAddress(userAddress);
        setError('Necesitamos que MetaMask esté en Hardhat Local (Chain ID 31337) para leer el contrato.');
        return;
      }

      const votingContract = new Contract(CONTRACT_ADDRESS, VOTING_ABI, signer);
      setContract(votingContract);
      setAddress(userAddress);
      await refreshData(votingContract, userAddress);
    } catch (err: unknown) {
      console.error('Error al conectar wallet:', err);
      setError(getHumanError(err, 'No pudimos conectar la billetera. Verificá que MetaMask esté desbloqueado y que el nodo Hardhat esté corriendo.'));
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, refreshData]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        resetSession();
      } else {
        window.location.reload();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const handleSuccess = (msg: string) => {
    setTxSuccess(msg);
    setTxError(null);
    if (contract && address) void refreshData(contract, address);
  };

  const handleError = (msg: string) => {
    setTxError(msg);
    setTxSuccess(null);
  };

  const handleManualRefresh = () => {
    if (contract && address) void refreshData(contract, address);
  };

  return (
    <div className="app">
      <div className="app__ambient app__ambient--one" />
      <div className="app__ambient app__ambient--two" />

      <header className="header">
        <div className="header__brand" aria-label="Sistema Electoral Aconcagua">
          <span className="header__seal" role="img" aria-label="Urna digital">◈</span>
          <div>
            <div className="header__title">Aconcagua Civic Ledger</div>
            <div className="header__subtitle">Sistema electoral blockchain</div>
          </div>
        </div>

        {address ? (
          <div className="header__cluster">
            <StatusBadge status={electionState} />
            <div className="wallet-chip" title={address}>
              <span className="wallet-chip__dot" />
              <span>{shortenAddress(address)}</span>
              <strong>{isAdmin ? 'Administrador' : 'Votante'}</strong>
            </div>
            <button className="ghost-btn" onClick={handleManualRefresh} disabled={isRefreshing} type="button">
              {isRefreshing ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        ) : (
          <div className="header__hint">Red local · Hardhat</div>
        )}
      </header>

      <main className="app__main">
        {wrongNetwork && (
          <div className="alert alert--warning" role="alert">
            <span className="alert__icon">⚠️</span>
            <div className="alert__content">
              <strong>MetaMask está en otra red</strong>
              <p>Cambiá a <strong>Hardhat Local</strong> con Chain ID <strong>31337</strong>. Esta app no usa ETH real.</p>
            </div>
          </div>
        )}

        {error && !wrongNetwork && (
          <div className="alert alert--error" role="alert">
            <span className="alert__icon">!</span>
            <div className="alert__content">
              <strong>Necesitamos revisar la conexión</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!address ? (
          <section className="connect-screen" aria-labelledby="connect-title">
            <div className="connect-screen__copy">
              <div className="connect-screen__badge">
                <span className="connect-screen__badge-dot" />
                Urna inteligente · auditoría on-chain
              </div>
              <h1 id="connect-title" className="connect-screen__heading">
                Una elección digital que se entiende antes de firmar.
              </h1>
              <p className="connect-screen__description">
                Conectá MetaMask, verificá tu rol y seguí pasos simples. El contrato registra votos únicos, trazables y transparentes en una red local de Ethereum.
              </p>

              <div className="connect-actions">
                <button className="connect-btn" onClick={connectWallet} disabled={isConnecting} type="button">
                  <span className="connect-btn__icon">{isConnecting ? '⏳' : '🦊'}</span>
                  {isConnecting ? 'Esperando MetaMask…' : 'Conectar MetaMask'}
                </button>
                <span className="connect-screen__hint">No se usa dinero real: solo ETH de prueba de Hardhat.</span>
              </div>
            </div>

            <aside className="civic-card" aria-label="Resumen de experiencia">
              <div className="civic-card__topline">Credencial cívica digital</div>
              <div className="civic-card__stamp">Aconcagua</div>
              <div className="civic-card__grid">
                <span>01</span><strong>Conectar wallet</strong>
                <span>02</span><strong>Validar padrón</strong>
                <span>03</span><strong>Emitir voto</strong>
              </div>
              <p>La app te avisa cuándo tenés que confirmar una transacción y cuándo solo está leyendo información pública.</p>
            </aside>
          </section>
        ) : (
          <section className="dashboard" aria-label="Panel principal de la elección">
            <div className="dashboard-hero">
              <div>
                <p className="eyebrow">{isAdmin ? 'Panel institucional' : 'Mesa de votación digital'}</p>
                <h2>{isAdmin ? 'Control del comicio' : 'Tu participación en la elección'}</h2>
                <p>
                  {isAdmin
                    ? 'Administrá candidatos, padrón y apertura/cierre sin perder de vista el estado público de la elección.'
                    : 'Revisá si estás habilitado, elegí candidato cuando la elección esté abierta y confirmá el voto en MetaMask.'}
                </p>
              </div>
              <div className="election-meter" aria-label={`Estado del comicio: ${getElectionStateLabel(electionState)}`}>
                <span>{getElectionStateLabel(electionState)}</span>
                <div className="election-meter__track"><i style={{ width: `${progress}%` }} /></div>
              </div>
            </div>

            <div className="status-grid">
              <article className="status-card">
                <span className="status-card__icon">◉</span>
                <div>
                  <p className="status-card__label">Estado</p>
                  <strong className="status-card__value status-card__value--highlight">{getElectionStateLabel(electionState)}</strong>
                </div>
              </article>
              <article className="status-card">
                <span className="status-card__icon">▦</span>
                <div>
                  <p className="status-card__label">Candidatos</p>
                  <strong className="status-card__value">{candidates.length}</strong>
                </div>
              </article>
              <article className="status-card">
                <span className="status-card__icon">◌</span>
                <div>
                  <p className="status-card__label">Padrón</p>
                  <strong className="status-card__value">{totalRegisteredVoters} habilitados</strong>
                </div>
              </article>
              <article className="status-card">
                <span className="status-card__icon">✓</span>
                <div>
                  <p className="status-card__label">Tu rol</p>
                  <strong className="status-card__value">{isAdmin ? 'Administrador' : isAuthorized ? 'Votante habilitado' : 'Pendiente de padrón'}</strong>
                </div>
              </article>
            </div>

            {txSuccess && (
              <div className="alert alert--success" role="status">
                <span className="alert__icon">✓</span>
                <div className="alert__content"><p>{txSuccess}</p></div>
              </div>
            )}
            {txError && (
              <div className="alert alert--error" role="alert">
                <span className="alert__icon">!</span>
                <div className="alert__content"><p>{txError}</p></div>
              </div>
            )}

            <div className="workspace-grid">
              <div className="workspace-grid__main">
                {isAdmin && contract ? (
                  <AdminPanel
                    contract={contract}
                    electionState={electionState}
                    candidateCount={candidates.length}
                    totalRegisteredVoters={totalRegisteredVoters}
                    totalVotes={totalVotes}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                ) : contract ? (
                  <VoterPanel
                    contract={contract}
                    electionState={electionState}
                    candidates={candidates}
                    isAuthorized={isAuthorized}
                    hasVoted={hasVoted}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                ) : null}
              </div>

              <aside className="workspace-grid__side">
                <ResultsPanel
                  candidates={candidates}
                  totalVotes={totalVotes}
                  totalRegisteredVoters={totalRegisteredVoters}
                  electionState={electionState}
                />
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>Universidad del Aconcagua · Base de Datos Avanzada · 2026</span>
        <span>Contrato: {CONTRACT_ADDRESS ? shortenAddress(CONTRACT_ADDRESS) : 'sin configurar'}</span>
      </footer>
    </div>
  );
}

export default App;
