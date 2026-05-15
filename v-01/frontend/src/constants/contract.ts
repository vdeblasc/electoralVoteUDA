/**
 * ══════════════════════════════════════════════════════════════
 *  constants/contract.ts
 * ══════════════════════════════════════════════════════════════
 *  Contiene la dirección del contrato leída desde las variables
 *  de entorno (.env) y el ABI (Application Binary Interface) 
 *  en formato legible por humanos (Human-Readable ABI).
 */

// Obtenemos la dirección del contrato desde .env de Vite
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

/**
 * ABI Minimalista Completo
 * Definimos las firmas exactas del Smart Contract Voting.sol.
 * Usamos tipos básicos nativos de Solidity (address, uint8, uint256, bool, string).
 */
export const VOTING_ABI = [
  // Funciones de Lectura (view)
  'function owner() view returns (address)',
  'function electionState() view returns (uint8)', // 0: Created, 1: Open, 2: Closed
  'function getCandidateCount() view returns (uint256)',
  'function getCandidate(uint256 _candidateId) view returns (string name, uint256 voteCount)',
  'function getAllResults() view returns (string[] names, uint256[] voteCounts)',
  'function isVoterAuthorized(address _voter) view returns (bool)',
  'function hasVoterVoted(address _voter) view returns (bool)',

  // Funciones de Escritura (cambian el estado, requieren gas)
  'function authorizeVoter(address _voter)',
  'function openVoting()',
  'function closeVoting()',
  'function vote(uint256 _candidateId)'
];
