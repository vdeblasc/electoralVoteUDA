import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

/**
 * Hardhat 3 Configuration — electoralVoteUDA
 *
 * Optimizado para desarrollo local en Windows con MetaMask.
 * - Red "localNode" con chainId 1337 para compatibilidad con MetaMask
 * - Solidity 0.8.24 con optimizer habilitado para producción
 */
export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],

  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    // ─── Red local para desarrollo (MetaMask-friendly) ───
    // Levanta con: npx hardhat node
    // MetaMask → Red personalizada → http://127.0.0.1:8545 / Chain ID: 1337
    localNode: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainType: "l1",
    },
  },
});
