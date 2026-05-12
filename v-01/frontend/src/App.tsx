/**
 * ══════════════════════════════════════════════════════════════
 *  App.tsx — Componente principal del Sistema Electoral UDA
 * ══════════════════════════════════════════════════════════════
 *
 *  ¿Qué hace este archivo?
 *  -  Conecta la billetera MetaMask del usuario (función connectWallet)
 *  -  Valida que esté en la red local de Hardhat (Chain ID 31337)
 *  -  Muestra la dirección del usuario conectado
 *  -  Maneja errores cuando el usuario rechaza la conexión
 *
 *  ¿Qué NO hace todavía?
 *  -  No interactúa con el contrato Voting (eso viene en el próximo paso)
 *  -  No implementa lógica de votación, solo la conexión estable
 *
 *  Tecnologías:
 *  -  React 19 + TypeScript
 *  -  Ethers.js v6 (BrowserProvider para conectarse a MetaMask)
 *  -  CSS modular (App.css)
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import './App.css';

/*
 * ══════════════════════════════════════════════════════════════
 *  📋 IMPORTACIÓN DEL ABI — GUÍA PARA EL EQUIPO
 * ══════════════════════════════════════════════════════════════
 *
 *  ¿Qué es el ABI?
 *  El ABI (Application Binary Interface) es un archivo JSON que describe
 *  TODAS las funciones, eventos y estructuras de nuestro contrato Voting.
 *  Ethers.js lo necesita para saber cómo "hablarle" al contrato.
 *
 *  ¿De dónde sale?
 *  Cuando ejecutamos `npx hardhat compile`, Hardhat genera el ABI en:
 *    → v-01/artifacts/contracts/Voting.sol/Voting.json
 *
 *  ¿Cómo importarlo en el frontend?
 *  Hay 2 opciones:
 *
 *  OPCIÓN A — Copiar solo el array ABI a un archivo local (RECOMENDADA):
 *  1. Abrir artifacts/contracts/Voting.sol/Voting.json
 *  2. Copiar SOLO el contenido de la key "abi" (el array grande)
 *  3. Crear un archivo src/contracts/VotingABI.json y pegar ahí el array
 *  4. Importar así:
 *
 *     import VotingABI from './contracts/VotingABI.json';
 *
 *  OPCIÓN B — Importar el JSON completo del artefacto de Hardhat:
 *  1. Importar directamente desde la carpeta artifacts (más frágil):
 *
 *     import VotingArtifact from '../../../artifacts/contracts/Voting.sol/Voting.json';
 *     const VotingABI = VotingArtifact.abi;
 *
 *  ⚠️  La opción B se rompe si cambias la estructura de carpetas.
 *      La opción A es más segura y explícita.
 *
 *  Dirección del contrato desplegado (deploy.ts la imprime en consola):
 *  → 0x5FbDB2315678afecb367f032d93F642f64180aa3
 *
 *  Después de importar el ABI, creamos la instancia del contrato así:
 *
 *     import { Contract } from 'ethers';
 *
 *     const contract = new Contract(
 *       '0x5FbDB2315678afecb367f032d93F642f64180aa3', // dirección
 *       VotingABI,                                     // ABI importado
 *       signer                                         // firmante (MetaMask)
 *     );
 *
 *  Esto se implementará en el próximo paso.
 * ══════════════════════════════════════════════════════════════
 */

// ── Constantes de configuración ──

/**
 * HARDHAT_CHAIN_ID — Chain ID de la red local de Hardhat.
 *
 * ¿Por qué 31337?
 * Cuando ejecutamos `npx hardhat node`, Hardhat crea una blockchain local
 * con Chain ID 31337 (0x7A69 en hexadecimal). MetaMask necesita estar
 * conectado a esta misma red para poder firmar transacciones.
 *
 * Si el usuario tiene MetaMask en Ethereum Mainnet (Chain ID 1) o en
 * Sepolia (Chain ID 11155111), las transacciones fallarán porque apuntan
 * a otra blockchain. Por eso validamos el Chain ID al conectar.
 */
const HARDHAT_CHAIN_ID = 31337n;

/**
 * HARDHAT_CHAIN_ID_HEX — El mismo Chain ID pero en formato hexadecimal.
 *
 * ¿Por qué en hex?
 * La API de MetaMask (wallet_switchEthereumChain) requiere el chainId
 * en formato hexadecimal con prefijo "0x". JavaScript maneja números
 * en decimal, pero MetaMask habla en hexadecimal.
 */
const HARDHAT_CHAIN_ID_HEX = '0x7A69';

// ── Tipado para window.ethereum ──

/**
 * ¿Por qué este tipo?
 * MetaMask inyecta un objeto `ethereum` en la ventana del navegador.
 * TypeScript no lo conoce por defecto, así que le decimos que existe
 * y qué métodos tiene. Esto nos da autocompletado y evita errores.
 *
 * `request` es el método principal: le pasamos el nombre del método
 * RPC (como 'eth_requestAccounts') y nos devuelve la respuesta.
 */
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

// Le decimos a TypeScript que `window` puede tener `ethereum`
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// ══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

function App() {
  // ── Estado de React ──
  // Estos son los datos que cambian y que React necesita re-renderizar.

  /** Dirección del wallet conectado (ej: "0xf39F...2266") */
  const [address, setAddress] = useState<string | null>(null);

  /** ¿Está en proceso de conectar? (para deshabilitar el botón) */
  const [isConnecting, setIsConnecting] = useState(false);

  /** Mensaje de error para mostrar al usuario */
  const [error, setError] = useState<string | null>(null);

  /** ¿Está en la red incorrecta? */
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // ──────────────────────────────────────────────
  // Función: checkNetwork
  // ──────────────────────────────────────────────

  /**
   * Verifica que MetaMask esté conectado a Hardhat Network (31337).
   *
   * ¿Por qué es importante?
   * Si el usuario está en Mainnet, cualquier transacción intentaría
   * gastar ETH REAL. En nuestra red local el ETH es de prueba y gratis.
   *
   * @param provider - El BrowserProvider de Ethers.js (wrappea MetaMask)
   * @returns true si está en la red correcta, false si no
   */
  const checkNetwork = useCallback(async (provider: BrowserProvider): Promise<boolean> => {
    try {
      // getNetwork() retorna info de la red: name, chainId, etc.
      const network = await provider.getNetwork();

      if (network.chainId !== HARDHAT_CHAIN_ID) {
        setWrongNetwork(true);
        setError(null);

        // Intentamos cambiar automáticamente a la red Hardhat.
        // Si MetaMask no la tiene configurada, le pedimos que la agregue.
        try {
          await window.ethereum!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
          });
          setWrongNetwork(false);
          return true;
        } catch {
          // Si el cambio falla (red no encontrada), intentamos agregarla
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
            // El usuario rechazó agregar la red
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

  /**
   * Conecta la billetera MetaMask del usuario.
   *
   * Flujo paso a paso:
   * 1. Verificar que MetaMask esté instalado en el navegador
   * 2. Pedir permiso al usuario (abre el popup de MetaMask)
   * 3. Si acepta, obtenemos su dirección pública
   * 4. Validar que esté en la red Hardhat (Chain ID 31337)
   * 5. Guardar la dirección en el estado de React
   *
   * Manejo de errores:
   * - Si MetaMask no está instalado → mensaje con link de descarga
   * - Si el usuario rechaza → mensaje amigable, no se rompe la app
   * - Si hay otro error → mensaje genérico
   */
  const connectWallet = useCallback(async () => {
    // Limpiamos errores anteriores para no confundir al usuario
    setError(null);
    setIsConnecting(true);

    try {
      // ── Paso 1: ¿Tiene MetaMask? ──
      // MetaMask inyecta `window.ethereum` cuando está instalado.
      // Si no existe, el usuario necesita instalarlo primero.
      if (!window.ethereum) {
        setError(
          'MetaMask no detectado. Instalá la extensión desde metamask.io ' +
          'y recargá esta página.'
        );
        return;
      }

      // ── Paso 2: Crear el Provider ──
      // BrowserProvider es la forma de Ethers.js v6 de conectarse a MetaMask.
      // En Ethers v5 se usaba "Web3Provider" — fue renombrado en v6.
      const provider = new BrowserProvider(window.ethereum);

      // ── Paso 3: Pedir cuentas al usuario ──
      // getSigner() abre el popup de MetaMask pidiendo permiso.
      // Si el usuario acepta, nos devuelve un Signer (firmante)
      // que puede enviar transacciones.
      //
      // ¿Por qué Signer y no solo la dirección?
      // El Signer puede FIRMAR transacciones (votar, agregar candidatos).
      // Solo leer datos no requiere Signer, pero para escribir sí.
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // ── Paso 4: Validar la red ──
      const isCorrectNetwork = await checkNetwork(provider);

      if (!isCorrectNetwork) {
        // Si no está en la red correcta, igual guardamos la dirección
        // pero mostramos la advertencia. El usuario puede cambiar de red.
        setAddress(userAddress);
        return;
      }

      // ── Paso 5: ¡Éxito! Guardar la dirección ──
      setAddress(userAddress);
      setWrongNetwork(false);

    } catch (err: unknown) {
      // ── Manejo de errores ──
      // MetaMask lanza errores con códigos específicos.
      // El más común es 4001: "User rejected the request" (cerró el popup).

      const error = err as { code?: number; message?: string };

      if (error.code === 4001) {
        // El usuario cerró el popup de MetaMask — es una acción válida.
        // No es un "error" real, solo decidió no conectarse ahora.
        setError('Conexión rechazada. Podés intentar de nuevo cuando quieras.');
      } else {
        // Error inesperado — logueamos para debugging
        console.error('Error al conectar wallet:', err);
        setError(
          'Error al conectar la billetera. Verificá que MetaMask esté ' +
          'desbloqueado y que el nodo Hardhat esté corriendo.'
        );
      }
    } finally {
      // Se ejecuta siempre, haya éxito o error.
      // Desbloqueamos el botón de conexión.
      setIsConnecting(false);
    }
  }, [checkNetwork]);

  // ──────────────────────────────────────────────
  // Efectos: Escuchar cambios de cuenta y red
  // ──────────────────────────────────────────────

  useEffect(() => {
    if (!window.ethereum) return;

    /**
     * ¿Por qué escuchamos estos eventos?
     *
     * El usuario puede cambiar de cuenta o de red MIENTRAS está usando la app.
     * Si no actualizamos nuestro estado, la dirección mostrada no coincidiría
     * con la cuenta real de MetaMask → transacciones fallarían silenciosamente.
     */

    // Cuando el usuario cambia de cuenta en MetaMask
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        // El usuario desconectó todas las cuentas
        setAddress(null);
        setError(null);
        setWrongNetwork(false);
      } else {
        // Cambió a otra cuenta → actualizar dirección
        setAddress(accs[0]);
      }
    };

    // Cuando el usuario cambia de red en MetaMask
    const handleChainChanged = () => {
      // La forma más segura de manejar un cambio de red es recargar.
      // Esto evita estados inconsistentes entre la app y MetaMask.
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup: remover listeners cuando el componente se desmonta
    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // ──────────────────────────────────────────────
  // Helpers de UI
  // ──────────────────────────────────────────────

  /**
   * Acorta una dirección Ethereum para mostrar en la UI.
   * "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
   * → "0xf39F...2266"
   *
   * ¿Por qué? Las direcciones tienen 42 caracteres — demasiado largo
   * para mostrar completo en un header o un botón.
   */
  const shortenAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

        {/* Mostramos el chip de wallet solo si hay conexión */}
        {address && (
          <div className="header__wallet" title={address}>
            <span className="header__wallet-dot" />
            {shortenAddress(address)}
          </div>
        )}
      </header>

      {/* ── Contenido Principal ── */}
      <main className="app__main">

        {/* ── Alerta: Red incorrecta ── */}
        {wrongNetwork && (
          <div className="alert alert--warning" role="alert" id="network-warning">
            <span className="alert__icon">⚠️</span>
            <div className="alert__content">
              <strong>Red incorrecta</strong>
              <p>
                Cambiá a la red <strong>Hardhat Local</strong> en MetaMask
                (Chain ID: 31337). Asegurate de que el nodo esté corriendo
                con <code>npx hardhat node</code>.
              </p>
            </div>
          </div>
        )}

        {/* ── Alerta: Error general ── */}
        {error && !wrongNetwork && (
          <div className="alert alert--error" role="alert" id="connection-error">
            <span className="alert__icon">❌</span>
            <div className="alert__content">
              <strong>Error de conexión</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!address ? (
          /* ══════════════════════════════════
             PANTALLA DE CONEXIÓN
             (Wallet NO conectada)
             ══════════════════════════════════ */
          <section className="connect-screen" id="connect-section">
            <div className="connect-screen__badge">
              <span className="connect-screen__badge-dot" />
              Blockchain · Ethereum Local
            </div>

            <h1 className="connect-screen__heading">
              Voto digital,{' '}
              <span className="connect-screen__heading-accent">
                transparencia real
              </span>
            </h1>

            <p className="connect-screen__description">
              Sistema de votación descentralizado para la Universidad del Azuay.
              Cada voto queda registrado en la blockchain — inmutable,
              verificable y sin intermediarios.
            </p>

            <button
              className="connect-btn"
              onClick={connectWallet}
              disabled={isConnecting}
              id="connect-wallet-btn"
              type="button"
            >
              <span className="connect-btn__icon">
                {isConnecting ? '⏳' : '🦊'}
              </span>
              {isConnecting ? 'Conectando...' : 'Conectar Billetera'}
            </button>

            <span className="connect-screen__hint">
              🔒 Se requiere MetaMask para participar
            </span>
          </section>
        ) : (
          /* ══════════════════════════════════
             DASHBOARD
             (Wallet CONECTADA)
             ══════════════════════════════════ */
          <section className="dashboard" id="dashboard-section">
            <div className="dashboard__welcome">
              <h2>¡Bienvenido, votante!</h2>
              <p>Tu billetera está conectada y verificada.</p>
            </div>

            {/* Tarjetas de estado */}
            <div className="status-grid">
              <div className="status-card" id="card-address">
                <div className="status-card__icon">👤</div>
                <div className="status-card__label">Tu dirección</div>
                <div className="status-card__value">{shortenAddress(address)}</div>
              </div>

              <div className="status-card" id="card-network">
                <div className="status-card__icon">🌐</div>
                <div className="status-card__label">Red</div>
                <div className="status-card__value status-card__value--highlight">
                  {wrongNetwork ? '⚠️ Red incorrecta' : 'Hardhat Local (31337)'}
                </div>
              </div>

              <div className="status-card" id="card-contract">
                <div className="status-card__icon">📄</div>
                <div className="status-card__label">Contrato</div>
                <div className="status-card__value">
                  {shortenAddress('0x5FbDB2315678afecb367f032d93F642f64180aa3')}
                </div>
              </div>
            </div>

            {/* Placeholder para la lógica de votación (próximo paso) */}
            <div className="coming-soon" id="voting-placeholder">
              <div className="coming-soon__icon">🚧</div>
              <div className="coming-soon__title">Módulo de Votación</div>
              <div className="coming-soon__text">
                La interfaz de votación se implementará en el siguiente sprint.
                El contrato ya está desplegado y listo.
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        Universidad del Azuay · Base de Datos Avanzada · 2026
        {' · '}
        <a
          href="https://hardhat.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hardhat
        </a>
        {' + '}
        <a
          href="https://docs.ethers.org/v6/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ethers.js v6
        </a>
      </footer>
    </div>
  );
}

export default App;
