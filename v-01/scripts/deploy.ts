/**
 * scripts/deploy.ts — Script de despliegue y población inicial
 *
 * ¿Qué hace este script?
 * 1. Despliega el contrato Voting en la red configurada.
 * 2. Agrega 2 candidatos de prueba (solo puede hacerse en estado "Created").
 * 3. Autoriza la segunda cuenta (Signer 1) como votante (empadronamiento).
 * 4. Abre la votación llamando a openVoting().
 *
 * ¿Por qué un script de población?
 * En nuestro proyecto el Smart Contract ES la base de datos.
 * Este script deja el contrato listo para que el frontend
 * pueda conectarse e interactuar sin configuración manual.
 *
 * ⚠️ Hardhat 3 usa ESM con top-level await.
 *    Los scripts ya no necesitan un main() envolvente.
 *
 * Ejecutar con:
 *   npx hardhat run scripts/deploy.ts                    (red por defecto — en memoria)
 *   npx hardhat run scripts/deploy.ts --network localNode (contra nodo persistente)
 */

// ── Importaciones ──
// Hardhat 3 con ESM: importamos `network` desde "hardhat"
// y creamos la conexión con `network.create()` que nos da `ethers`.
import { network } from "hardhat";

const { ethers } = await network.create();

// ──────────────────────────────────────────────
// Paso 0: Obtener las cuentas (Signers) disponibles
// ──────────────────────────────────────────────
// Hardhat Node nos da 20 cuentas pre-fondeadas con ETH de prueba.
// - signers[0] → Owner / Administrador (quien despliega el contrato)
// - signers[1] → Votante de prueba que vamos a autorizar
const signers = await ethers.getSigners();
const [owner, voter1] = signers;

console.log("═══════════════════════════════════════════════════════");
console.log("       🗳️  SISTEMA DE VOTACIÓN BLOCKCHAIN — UDA       ");
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log(`📋 Owner (administrador):  ${owner.address}`);
console.log(`👤 Voter1 (a autorizar):   ${voter1.address}`);
console.log();

// ──────────────────────────────────────────────
// Paso 1: Desplegar el contrato Voting
// ──────────────────────────────────────────────
// getContractFactory busca el artefacto compilado de "Voting"
// en la carpeta artifacts/. Si no existe, Hardhat lo compila primero.
//
// .deploy() envía la transacción de creación del contrato.
// .waitForDeployment() espera a que se mine el bloque (en local es instantáneo).
console.log("🔄 Desplegando contrato Voting...");
const VotingFactory = await ethers.getContractFactory("Voting");
const voting = await VotingFactory.deploy();
await voting.waitForDeployment();

// ¿Por qué guardamos la dirección?
// El frontend necesita esta dirección para conectarse al contrato.
// En un escenario real, la guardaríamos en un archivo .env o JSON.
const contractAddress = await voting.getAddress();
console.log(`✅ Contrato desplegado en: ${contractAddress}`);
console.log();

// ──────────────────────────────────────────────
// Paso 2: Agregar candidatos (solo en estado Created)
// ──────────────────────────────────────────────
// addCandidate() solo funciona cuando electionState == Created.
// El owner (signers[0]) es quien ejecuta estas transacciones
// porque el modifier onlyOwner lo requiere.
console.log("📝 Agregando candidatos...");

// Candidato A → ID = 0 (primer elemento del array)
const tx1 = await voting.addCandidate("Candidato A");
await tx1.wait(); // Esperamos confirmación del bloque
console.log("   ✅ Candidato A agregado (ID: 0)");

// Candidato B → ID = 1 (segundo elemento del array)
const tx2 = await voting.addCandidate("Candidato B");
await tx2.wait();
console.log("   ✅ Candidato B agregado (ID: 1)");
console.log();

// ──────────────────────────────────────────────
// Paso 3: Autorizar (empadronar) al votante de prueba
// ──────────────────────────────────────────────
// authorizeVoter() registra la dirección en el padrón electoral.
// Solo el owner puede hacerlo (modifier onlyOwner).
// Un votante no autorizado recibirá un revert al intentar votar.
console.log("🪪  Empadronando votantes...");
const tx3 = await voting.authorizeVoter(voter1.address);
await tx3.wait();
console.log(`   ✅ Votante autorizado: ${voter1.address}`);
console.log();

// ──────────────────────────────────────────────
// Paso 4: Abrir la votación (Created → Open)
// ──────────────────────────────────────────────
// openVoting() cambia el estado del comicio de Created a Open.
// A partir de este momento, los votantes autorizados pueden votar.
// ⚠️ Una vez abierto, NO se pueden agregar más candidatos.
console.log("🗳️  Abriendo votación...");
const tx4 = await voting.openVoting();
await tx4.wait();
console.log("   ✅ ¡Votación abierta! Estado: Open");
console.log();

// ──────────────────────────────────────────────
// Resumen final
// ──────────────────────────────────────────────
const candidateCount = await voting.getCandidateCount();
const registeredVoters = await voting.totalRegisteredVoters();

console.log("═══════════════════════════════════════════════════════");
console.log("                    📊 RESUMEN                        ");
console.log("═══════════════════════════════════════════════════════");
console.log(`  Dirección del contrato:  ${contractAddress}`);
console.log(`  Candidatos registrados:  ${candidateCount}`);
console.log(`  Votantes empadronados:   ${registeredVoters}`);
console.log(`  Estado del comicio:      Open (listo para votar)`);
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log("💡 Próximos pasos:");
console.log("   1. Copia la dirección del contrato al frontend (.env)");
console.log("   2. Conecta MetaMask a http://127.0.0.1:8545 (Chain ID: 1337)");
console.log("   3. Importa la cuenta del Voter1 en MetaMask con su clave privada");
console.log();
