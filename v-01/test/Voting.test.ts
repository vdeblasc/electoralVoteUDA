/**
 * test/Voting.test.ts — Suite de pruebas automatizadas del contrato Voting
 *
 * ¿Por qué hacemos tests?
 * En blockchain, un contrato desplegado NO se puede modificar.
 * Si tiene un bug, perdemos. Los tests nos dan confianza antes de desplegar.
 *
 * Herramientas utilizadas:
 * - Mocha:  Framework de tests (describe, it, before)
 * - Chai:   Librería de aserciones (expect)
 * - Hardhat Network Helpers: loadFixture para reiniciar el estado entre tests
 * - Ethers.js v6: Interacción con el contrato (connect, getContractFactory)
 *
 * Patrón Fixture en Hardhat 3:
 * networkHelpers.loadFixture() ejecuta una función (nuestro "fixture") solo
 * la primera vez, toma un "snapshot" del estado de la blockchain y en cada
 * test siguiente hace un revert a ese snapshot. Más rápido que redesplegar.
 *
 * ⚠️  Hardhat 3 usa `network.create()` para obtener ethers y networkHelpers.
 * Los fixtures reciben un `NetworkConnection` como argumento (no global hre).
 *
 * Ejecutar con:
 *   npx hardhat test
 *   npx hardhat test test/Voting.test.ts   (solo este archivo)
 */

// ── Importaciones ──
import { expect } from "chai";
import { network } from "hardhat";

// ── Tipo del contrato (autogenerado por hardhat-typechain) ──
import type { Voting } from "../types/ethers-contracts/Voting.js";

// ── Conexión a la red de prueba ──
// Hardhat 3 requiere crear una conexión a la red para obtener
// `ethers` y `networkHelpers`. Esto se hace con top-level await (ESM).
const { ethers, networkHelpers } = await network.create();

// ══════════════════════════════════════════════════════════════
//                    FIXTURES (Estado inicial)
// ══════════════════════════════════════════════════════════════

/**
 * deployFixture — Despliega el contrato Voting limpio.
 *
 * ¿Por qué un fixture separado?
 * Porque cada grupo de tests necesita un estado inicial diferente.
 * Este fixture nos da un contrato recién desplegado en estado "Created".
 *
 * En Hardhat 3, los fixtures reciben un `NetworkConnection` como parámetro.
 * Aquí usamos el ethers del scope superior porque ya lo tenemos.
 */
async function deployFixture() {
  // Obtenemos las cuentas de prueba de Hardhat
  // - owner (signers[0]) → administrador electoral (despliega el contrato)
  // - voter1 → votante autorizado para los tests
  // - voter2 → votante adicional para tests de múltiples votos
  // - outsider → persona NO autorizada (para tests de seguridad)
  const [owner, voter1, voter2, outsider] = await ethers.getSigners();

  // Desplegamos una instancia fresca del contrato
  const VotingFactory = await ethers.getContractFactory("Voting");
  const voting = await VotingFactory.deploy();
  await voting.waitForDeployment();

  // Retornamos todo lo que los tests necesiten
  return { voting: voting as unknown as Voting, owner, voter1, voter2, outsider };
}

/**
 * readyToVoteFixture — Contrato configurado y listo para votar.
 *
 * Estado: 2 candidatos registrados, voter1 autorizado, votación abierta.
 * Nos ahorra repetir la misma configuración en muchos tests.
 */
async function readyToVoteFixture() {
  const { voting, owner, voter1, voter2, outsider } = await deployFixture();

  // Configurar candidatos (solo posible en estado Created)
  await voting.addCandidate("Candidato A");
  await voting.addCandidate("Candidato B");

  // Empadronar voter1 (autorizarlo en el padrón electoral)
  await voting.authorizeVoter(voter1.address);

  // Abrir votación (transición Created → Open)
  await voting.openVoting();

  return { voting, owner, voter1, voter2, outsider };
}

// ══════════════════════════════════════════════════════════════
//                         TESTS
// ══════════════════════════════════════════════════════════════

describe("Voting", function () {

  // ────────────────────────────────────────────
  // 1. DESPLIEGUE
  // ────────────────────────────────────────────
  describe("Despliegue", function () {

    it("debería asignar al deployer como owner", async function () {
      // ¿Por qué este test?
      // El owner es quien controla el comicio. Si no se asigna bien,
      // nadie podría agregar candidatos ni abrir la votación.
      const { voting, owner } = await networkHelpers.loadFixture(deployFixture);

      expect(await voting.owner()).to.equal(owner.address);
    });

    it("debería iniciar en estado Created", async function () {
      // ¿Por qué?
      // El enum ElectionState.Created tiene valor 0.
      // Si el estado inicial no es 0, las funciones de setup fallarían.
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      // ElectionState.Created == 0n (bigint en Ethers v6)
      expect(await voting.electionState()).to.equal(0n);
    });

    it("debería empezar sin candidatos", async function () {
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      expect(await voting.getCandidateCount()).to.equal(0n);
    });
  });

  // ────────────────────────────────────────────
  // 2. GESTIÓN DE CANDIDATOS (Owner)
  // ────────────────────────────────────────────
  describe("Gestión de Candidatos", function () {

    it("debería permitir al owner agregar candidatos", async function () {
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      await voting.addCandidate("Candidato A");
      await voting.addCandidate("Candidato B");

      // Verificamos que se registraron 2 candidatos
      expect(await voting.getCandidateCount()).to.equal(2n);

      // Verificamos los datos del primer candidato
      const [name, voteCount] = await voting.getCandidate(0);
      expect(name).to.equal("Candidato A");
      expect(voteCount).to.equal(0n);
    });

    it("debería rechazar candidatos con nombre vacío", async function () {
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      // ¿Por qué validamos esto?
      // Un candidato sin nombre sería confuso en la interfaz.
      // El contrato hace: require(bytes(_name).length > 0)
      await expect(voting.addCandidate(""))
        .to.be.revertedWith("El nombre del candidato no puede estar vacio");
    });

    it("debería rechazar si un no-owner intenta agregar candidatos", async function () {
      // ¿Por qué?
      // Solo el administrador electoral puede definir los candidatos.
      // Si cualquiera pudiera, la elección no tendría validez.
      const { voting, outsider } = await networkHelpers.loadFixture(deployFixture);

      await expect(voting.connect(outsider).addCandidate("Intruso"))
        .to.be.revertedWith("Solo el administrador puede realizar esta accion");
    });

    it("no debería permitir agregar candidatos después de abrir la votación", async function () {
      const { voting } = await networkHelpers.loadFixture(readyToVoteFixture);

      // El comicio ya está Open → addCandidate requiere Created
      await expect(voting.addCandidate("Candidato Tardío"))
        .to.be.revertedWith("El comicio no esta en el estado correcto");
    });
  });

  // ────────────────────────────────────────────
  // 3. EMPADRONAMIENTO DE VOTANTES (Owner)
  // ────────────────────────────────────────────
  describe("Empadronamiento de Votantes", function () {

    it("debería permitir al owner autorizar votantes", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(deployFixture);

      await voting.authorizeVoter(voter1.address);

      // Verificamos que el votante quedó registrado en el padrón
      expect(await voting.isVoterAuthorized(voter1.address)).to.be.true;
      expect(await voting.totalRegisteredVoters()).to.equal(1n);
    });

    it("debería rechazar autorización duplicada", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(deployFixture);

      await voting.authorizeVoter(voter1.address);

      // Intentar autorizar de nuevo → revert
      await expect(voting.authorizeVoter(voter1.address))
        .to.be.revertedWith("El votante ya esta autorizado");
    });

    it("debería rechazar la dirección cero", async function () {
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      // ¿Por qué?
      // La dirección 0x0 es un "agujero negro" en Ethereum.
      // Autorizar esa dirección no tendría sentido.
      await expect(voting.authorizeVoter("0x0000000000000000000000000000000000000000"))
        .to.be.revertedWith("Direccion invalida");
    });

    it("debería rechazar si un no-owner intenta empadronar", async function () {
      const { voting, outsider, voter1 } = await networkHelpers.loadFixture(deployFixture);

      await expect(voting.connect(outsider).authorizeVoter(voter1.address))
        .to.be.revertedWith("Solo el administrador puede realizar esta accion");
    });
  });

  // ────────────────────────────────────────────
  // 4. CONTROL DEL COMICIO (Apertura y Cierre)
  // ────────────────────────────────────────────
  describe("Control del Comicio", function () {

    it("debería permitir abrir la votación con candidatos", async function () {
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      await voting.addCandidate("Candidato A");
      await voting.openVoting();

      // ElectionState.Open == 1n
      expect(await voting.electionState()).to.equal(1n);
    });

    it("debería rechazar abrir sin candidatos", async function () {
      // ¿Por qué?
      // Una elección sin candidatos no tiene sentido.
      // El contrato valida: require(candidates.length > 0)
      const { voting } = await networkHelpers.loadFixture(deployFixture);

      await expect(voting.openVoting())
        .to.be.revertedWith("Debe haber al menos un candidato");
    });

    it("debería permitir cerrar la votación", async function () {
      const { voting } = await networkHelpers.loadFixture(readyToVoteFixture);

      await voting.closeVoting();

      // ElectionState.Closed == 2n
      expect(await voting.electionState()).to.equal(2n);
    });

    it("debería rechazar si un no-owner intenta abrir/cerrar", async function () {
      const { voting, outsider } = await networkHelpers.loadFixture(readyToVoteFixture);

      await expect(voting.connect(outsider).closeVoting())
        .to.be.revertedWith("Solo el administrador puede realizar esta accion");
    });
  });

  // ────────────────────────────────────────────
  // 5. EMISIÓN DE VOTO (Votante autorizado)
  // ────────────────────────────────────────────
  describe("Emisión de Voto", function () {

    it("debería permitir votar a un votante autorizado", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // voter1 vota por el Candidato A (ID: 0)
      // .connect(voter1) cambia el msg.sender al voter1
      await voting.connect(voter1).vote(0);

      // Verificamos que el voto se registró correctamente
      const [name, voteCount] = await voting.getCandidate(0);
      expect(name).to.equal("Candidato A");
      expect(voteCount).to.equal(1n); // ¡El conteo subió!

      // Verificamos que el votante quedó marcado como "ya votó"
      expect(await voting.hasVoterVoted(voter1.address)).to.be.true;

      // Verificamos el total de votos
      expect(await voting.totalVotes()).to.equal(1n);
    });

    it("debería emitir el evento VoteCast al votar", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // ¿Por qué verificamos eventos?
      // Los eventos son la forma de auditoría en blockchain (US-08).
      // El frontend los escucha para actualizar la UI en tiempo real.
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0);
    });

    it("debería RECHAZAR voto de un NO autorizado", async function () {
      // ── TEST DE SEGURIDAD CRÍTICO ──
      // ¿Por qué?
      // Si alguien no está en el padrón, no puede votar.
      // Esto previene que personas externas manipulen la elección.
      const { voting, outsider } = await networkHelpers.loadFixture(readyToVoteFixture);

      await expect(voting.connect(outsider).vote(0))
        .to.be.revertedWith("No estas en el padron");
    });

    it("debería RECHAZAR doble voto (misma persona, dos veces)", async function () {
      // ── TEST DE SEGURIDAD CRÍTICO ──
      // ¿Por qué?
      // Cada persona = 1 voto. Sin esta validación, alguien podría
      // votar infinitas veces y romper la integridad de la elección.
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // Primer voto → éxito
      await voting.connect(voter1).vote(0);

      // Segundo voto → REVERT
      await expect(voting.connect(voter1).vote(1))
        .to.be.revertedWith("Ya has emitido tu voto");
    });

    it("debería RECHAZAR voto con candidato inválido", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // Solo hay 2 candidatos (IDs 0 y 1). El ID 99 no existe.
      await expect(voting.connect(voter1).vote(99))
        .to.be.revertedWith("Candidato invalido");
    });

    it("debería RECHAZAR voto cuando el comicio está cerrado", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // El owner cierra la votación
      await voting.closeVoting();

      // voter1 intenta votar → REVERT
      await expect(voting.connect(voter1).vote(0))
        .to.be.revertedWith("El comicio no esta en el estado correcto");
    });
  });

  // ────────────────────────────────────────────
  // 6. CONSULTA DE RESULTADOS (Funciones View)
  // ────────────────────────────────────────────
  describe("Consulta de Resultados", function () {

    it("debería retornar los datos de un candidato con getCandidate()", async function () {
      const { voting } = await networkHelpers.loadFixture(readyToVoteFixture);

      const [name, voteCount] = await voting.getCandidate(0);
      expect(name).to.equal("Candidato A");
      expect(voteCount).to.equal(0n);
    });

    it("debería retornar todos los resultados con getAllResults()", async function () {
      const { voting, voter1 } = await networkHelpers.loadFixture(readyToVoteFixture);

      // voter1 vota por Candidato B (ID: 1)
      await voting.connect(voter1).vote(1);

      const [names, voteCounts] = await voting.getAllResults();

      // Verificamos ambos candidatos
      expect(names[0]).to.equal("Candidato A");
      expect(names[1]).to.equal("Candidato B");
      expect(voteCounts[0]).to.equal(0n);  // Sin votos
      expect(voteCounts[1]).to.equal(1n);  // 1 voto de voter1
    });

    it("debería revertir si se consulta un candidato inexistente", async function () {
      const { voting } = await networkHelpers.loadFixture(readyToVoteFixture);

      await expect(voting.getCandidate(99))
        .to.be.revertedWith("Candidato invalido");
    });
  });
});
