# 🗳️ Smart Contract — Entrega de Archivos

## Archivos creados/actualizados

| Archivo | Estado | Descripción |
| :--- | :--- | :--- |
| `Voting.sol` | ✅ Ya existía | Contrato principal — no requirió cambios |
| `deploy.ts` | ✅ Creado | Script de despliegue + población |
| `Voting.test.ts` | ✅ Creado | Suite de 18 tests automatizados |

---

## Resumen técnico

### 1. Contrato `Voting.sol` (ya existente)
El contrato ya implementaba todo lo solicitado:

* **Structs:** `Voter` (`isAuthorized`, `hasVoted`, `votedCandidateId`) y `Candidate` (`name`, `voteCount`).
* **Máquina de estados:** `ElectionState { Created, Open, Closed }`.
* **Owner immutable:** Asignado al deployer en el constructor.
* **Modifiers:** `onlyOwner` + `inState`.
* **Funciones Owner:** `addCandidate()`, `authorizeVoter()`, `openVoting()`, `closeVoting()`.
* **Función Votante:** `vote()` con triple validación (padrón, unicidad, estado).
* **Funciones View:** `getCandidate()`, `getAllResults()`, `getCandidateCount()`.
* **Eventos:** `VoteCast`, `VoterAuthorized`, `CandidateAdded`, `ElectionStateChanged`.
* **Seguridad:** Patrón CEI, validación de inputs, Solidity 0.8.24 (overflow nativo).

### 2. Script `deploy.ts`
**Flujo del script:**
Obtener Signers → Deploy → `addCandidate×2` → `authorizeVoter` → `openVoting` → Resumen

### 3. Suite de Tests `Voting.test.ts`
18 tests organizados en 6 bloques:

| Bloque | Tests | Cobertura |
| :--- | :--- | :--- |
| **Despliegue** | 3 | Owner, estado inicial, sin candidatos |
| **Candidatos** | 4 | Agregar, nombre vacío, no-owner, post-apertura |
| **Empadronamiento** | 4 | Autorizar, duplicado, `address(0)`, no-owner |
| **Control Comicio** | 4 | Abrir, sin candidatos, cerrar, no-owner |
| **Emisión de Voto** | 6 | Voto OK, evento, NO autorizado, doble voto, candidato inválido, comicio cerrado |
| **Resultados** | 3 | `getCandidate`, `getAllResults`, inexistente |

---

> **⚠️ IMPORTANT**
> Los tests usan la API de Hardhat 3 (no Hardhat 2):
> * `import { network } from "hardhat"` + `await network.create()`
> * `networkHelpers.loadFixture()` en lugar del import directo.

---

## Comandos para ejecutar

```bash
# Compilar el contrato
npx hardhat compile

# Ejecutar todos los tests
npx hardhat test

# Levantar nodo local + desplegar
npx hardhat node                                        # Terminal 1
npx hardhat run scripts/deploy.ts --network localNode   # Terminal 2