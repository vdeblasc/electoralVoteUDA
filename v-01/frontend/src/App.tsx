/**
 * ══════════════════════════════════════════════════════════════
 *  App.tsx — Componente principal del Sistema Electoral UDA
 * ══════════════════════════════════════════════════════════════
 *
 *  Refactorización Modular:
 *  - Lógica central de conexión a MetaMask.
 *  - Función refreshData() para actualizar estado del comicio y candidatos.
 *  - Renderizado condicional de componentes: AdminPanel y VoterPanel.
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import type { Signer } from 'ethers';

// Estilos
import './App.css';

// Constantes y Configuración
import { CONTRACT_ADDRESS, VOTING_ABI } from './constants/contract';

// Componentes
import StatusBadge from './components/StatusBadge';
import AdminPanel from './components/AdminPanel';
import VoterPanel, { type Candidate } from './components/VoterPanel';

// ── Configuración de red ──
const HARDHAT_CHAIN_ID = 31337n;
const HARDHAT_CHAIN_ID_HEX = '0x7A69';

// ── Tipado para window.ethereum (MetaMask) ──
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

// ══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

function App() {
  // ── Estado: conexión ──
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // ── Estado: contrato y datos de blockchain ──
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [electionState, setElectionState] = useState<number | null>(null);
  
  // Datos del votante
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Lista de candidatos
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // ── Estado: notificaciones globales ──
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // ── Helpers derivados ──
  const isAdmin =
    address !== null &&
    contractOwner !== null &&
    address.toLowerCase() === contractOwner.toLowerCase();

  // ──────────────────────────────────────────────
  // Función: refreshData
  // ──────────────────────────────────────────────
  /**
   * Lee la información actualizada desde el Smart Contract.
   * Se ejecuta al conectarse por primera vez y después de cada transacción exitosa.
   */
  const refreshData = useCallback(async (votingContract: Contract, userAddr: string) => {
    try {
      // 1. Owner y Estado del comicio
      const ownerAddr: string = await votingContract.owner();
      setContractOwner(ownerAddr);

      // electionState retorna un uint8 (0: Created, 1: Open, 2: Closed)
      const state = Number(await votingContract.electionState());
      setElectionState(state);

      // 2. Estado del votante (isAuthorized, hasVoted)
      const authorized = await votingContract.isVoterAuthorized(userAddr);
      setIsAuthorized(authorized);

      const voted = await votingContract.hasVoterVoted(userAddr);
      setHasVoted(voted);

      // 3. Resultados y candidatos
      const [firstNames, lastNames, listNames, positions, voteCounts] = await votingContract.getAllResults();
      
      const parsedCandidates: Candidate[] = firstNames.map((firstName: string, index: number) => ({
        id: index,
        firstName,
        lastName: lastNames[index],
        listName: listNames[index],
        position: positions[index],
        voteCount: Number(voteCounts[index])
      }));
      setCandidates(parsedCandidates);

    } catch (err) {
      console.error('Error al actualizar datos del contrato:', err);
    }
  }, []);

  // ──────────────────────────────────────────────
  // Función: checkNetwork
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Función: connectWallet
  // ──────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!window.ethereum) {
        setError('MetaMask no detectado. Instalá la extensión desde metamask.io y recargá esta página.');
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer: Signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const isCorrectNetwork = await checkNetwork(provider);
      if (!isCorrectNetwork) {
        setAddress(userAddress);
        return;
      }

      // Crear instancia del contrato
      const votingContract = new Contract(CONTRACT_ADDRESS, VOTING_ABI, signer);
      setContract(votingContract);
      setAddress(userAddress);

      // Cargar datos del contrato
      await refreshData(votingContract, userAddress);

    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      if (error.code === 4001) {
        setError('Conexión rechazada. Podés intentar de nuevo cuando quieras.');
      } else {
        console.error('Error al conectar wallet:', err);
        setError('Error al conectar la billetera. Verificá que MetaMask esté desbloqueado y que el nodo Hardhat esté corriendo.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, refreshData]);

  // ──────────────────────────────────────────────
  // Efectos de MetaMask
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setAddress(null);
        setError(null);
        setWrongNetwork(false);
        setContractOwner(null);
        setContract(null);
      } else {
        window.location.reload();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // ── Helpers de UI ──
  const shortenAddress = (addr: string): string => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleSuccess = (msg: string) => {
    setTxSuccess(msg);
    setTxError(null);
    if (contract && address) {
      refreshData(contract, address); // Actualizar datos tras el éxito
    }
  };

  const handleError = (msg: string) => {
    setTxError(msg);
    setTxSuccess(null);
  };

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="app">
      {/* ── Header / Navbar ── */}
      <header className="header">
        <div className="header__brand">
          <span className="header__icon" role="img" aria-label="Urna">🗳️</span>
          <div>
            <div className="header__title">Sistema Electoral UDA</div>
            <div className="header__subtitle">Votación on-chain</div>
          </div>
        </div>

        {address && (
          <div className="header__wallet" title={address}>
            <StatusBadge status={electionState} />
            <span className="header__wallet-dot" />
            {shortenAddress(address)}
            {isAdmin && <span className="header__role-badge">Admin</span>}
          </div>
        )}
      </header>

      {/* ── Contenido Principal ── */}
      <main className="app__main">
        {wrongNetwork && (
          <div className="alert alert--warning" role="alert">
            <span className="alert__icon">⚠️</span>
            <div className="alert__content">
              <strong>Red incorrecta</strong>
              <p>Cambiá a la red <strong>Hardhat Local</strong> en MetaMask (Chain ID: 31337).</p>
            </div>
          </div>
        )}

        {error && !wrongNetwork && (
          <div className="alert alert--error" role="alert">
            <span className="alert__icon">❌</span>
            <div className="alert__content">
              <strong>Error de conexión</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!address ? (
          /* ── PANTALLA DE CONEXIÓN ── */
          <section className="connect-screen">
            <div className="connect-screen__badge">
              <span className="connect-screen__badge-dot" />
              Blockchain · Ethereum Local
            </div>
            <h1 className="connect-screen__heading">
              Voto digital, <span className="connect-screen__heading-accent">transparencia real</span>
            </h1>
            <p className="connect-screen__description">
              Sistema de votación descentralizado para la Universidad del Azuay.
            </p>
            <button
              className="connect-btn"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <span className="connect-btn__icon">{isConnecting ? '⏳' : '🦊'}</span>
              {isConnecting ? 'Conectando...' : 'Conectar Billetera'}
            </button>
            <span className="connect-screen__hint">🔒 Se requiere MetaMask para participar</span>
          </section>
        ) : (
          /* ── DASHBOARD (Admin o Votante) ── */
          <section className="dashboard">
            <div className="dashboard__welcome">
              <h2>{isAdmin ? '🛡️ ¡Bienvenido, Administrador!' : '¡Bienvenido, votante!'}</h2>
              <p>{isAdmin ? 'Panel de control del comicio electoral.' : 'Tu billetera está conectada y verificada.'}</p>
            </div>

            {/* Alertas Globales de Transacciones */}
            {txSuccess && (
              <div className="alert alert--success">
                <span className="alert__icon">✅</span>
                <div className="alert__content"><p>{txSuccess}</p></div>
              </div>
            )}
            {txError && (
              <div className="alert alert--error">
                <span className="alert__icon">❌</span>
                <div className="alert__content"><p>{txError}</p></div>
              </div>
            )}

            {/* Renderizado Condicional */}
            {isAdmin && contract ? (
              <AdminPanel
                contract={contract}
                electionState={electionState}
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
          </section>
        )}
      </main>

      <footer className="footer">
        Universidad del Azuay · Base de Datos Avanzada · 2026
      </footer>
    </div>
  );
}

export default App;
