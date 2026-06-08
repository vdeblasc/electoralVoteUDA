# 🗳️ Blockchain-Based Voting System — electoralVoteUDA

Sistema académico de votación blockchain con smart contract Solidity y frontend React/TypeScript.

La implementación principal está en [`v-01/`](./v-01/). Incluye:

- Contrato `Voting.sol` para candidatos, padrón, voto único y resultados.
- Frontend `Aconcagua Civic Ledger` con diseño moderno orientado a UX electoral.
- Scripts Hardhat para compilar, testear, levantar nodo local y desplegar.

## Inicio rápido

```powershell
cd v-01
npm install
cd frontend
npm install
```

Luego seguí la guía completa en [`v-01/README.md`](./v-01/README.md).

## Stack

- Solidity + Hardhat
- React + TypeScript + Vite
- ethers.js + MetaMask
- Red local Hardhat (`http://127.0.0.1:8545`, Chain ID `31337`)

## Roles

- **Administrador:** despliega contrato, empadrona votantes, carga candidatos y controla apertura/cierre.
- **Votante:** conecta wallet empadronada, vota una vez y consulta resultados.
- **Auditor/público:** puede revisar resultados agregados y trazabilidad on-chain.
