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

// (Omitido para que el administrador agregue candidatos desde el frontend)
console.log("   (Sin candidatos iniciales. Agregar desde el panel de admin)");
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
// Paso 4: (Omitido) Abrir la votación
// ──────────────────────────────────────────────
// Se debe abrir manualmente desde el panel de administrador
// una vez que los candidatos estén registrados.
console.log("🗳️  Estado inicial: Created (Listo para agregar candidatos)");
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
console.log(`  Estado del comicio:      Created (En preparación)`);
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log("💡 Próximos pasos:");
console.log("   1. Copia la dirección del contrato al frontend (.env)");
console.log("   2. Conecta MetaMask a http://127.0.0.1:8545 (Chain ID: 1337)");
console.log("   3. Importa la cuenta del Voter1 en MetaMask con su clave privada");
console.log();
