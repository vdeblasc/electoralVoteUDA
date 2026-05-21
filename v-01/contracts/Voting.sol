// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Voting — Sistema de Votación Blockchain (UDA)
 * @author Equipo electoralVoteUDA
 * @notice Contrato principal para gestión de elecciones on-chain.
 *         Cubre las Historias de Usuario US-01 a US-08.
 *
 * @dev Patrones de seguridad aplicados:
 *   - Checks-Effects-Interactions (CEI) en toda función de escritura
 *   - Máquina de estados para el ciclo de vida del comicio
 *   - Control de acceso con modifier onlyOwner
 *   - Validación de inputs con require
 *   - Eventos para auditoría y trazabilidad (US-08)
 *   - Solidity >=0.8 → protección nativa contra overflow/underflow
 *   - Sin llamadas externas → reentrancy no aplica en este contrato
 *   - Gas-optimizado: storage packing en struct Voter (2 bools = 1 slot)
 */
contract Voting {

    // ──────────────────────────────────────────────
    // Estado del Comicio (US-07)
    // ──────────────────────────────────────────────

    /// @notice Fases del comicio: Creado → Abierto → Finalizado (transición unidireccional)
    enum ElectionState { Created, Open, Closed }

    ElectionState public electionState;

    // ──────────────────────────────────────────────
    // Administrador (Owner)
    // ──────────────────────────────────────────────

    /// @notice Dirección del administrador electoral (quien despliega el contrato)
    address public immutable owner;

    // ──────────────────────────────────────────────
    // Candidatos
    // ──────────────────────────────────────────────

    struct Candidate {
        string firstName;
        string lastName;
        string listName;
        string position;
        uint256 voteCount;
    }

    /// @notice Lista de candidatos indexada por ID (posición en el array)
    Candidate[] public candidates;

    // ──────────────────────────────────────────────
    // Votantes / Padrón Electoral (US-02, US-03, US-05)
    // ──────────────────────────────────────────────

    struct Voter {
        bool isAuthorized;  // Pertenece al padrón
        bool hasVoted;      // Ya emitió su voto
        uint256 votedCandidateId; // ID del candidato por el que votó
    }

    /// @notice Mapa de dirección → datos del votante
    mapping(address => Voter) public voters;

    /// @notice Cantidad total de votos emitidos
    uint256 public totalVotes;

    /// @notice Cantidad de votantes registrados en el padrón
    uint256 public totalRegisteredVoters;

    // ──────────────────────────────────────────────
    // Eventos (US-08 — Auditoría y Trazabilidad)
    // ──────────────────────────────────────────────

    /// @notice Emitido cuando se registra un votante en el padrón
    event VoterAuthorized(address indexed voter);

    /// @notice Emitido cuando se emite un voto exitoso
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    /// @notice Emitido cuando cambia el estado del comicio
    event ElectionStateChanged(ElectionState newState);

    /// @notice Emitido cuando se agrega un candidato
    event CandidateAdded(uint256 indexed candidateId, string firstName, string lastName, string listName, string position);

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    /// @dev Solo el administrador (owner) puede ejecutar la función
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el administrador puede realizar esta accion");
        _;
    }

    /// @dev La función solo se puede ejecutar si el comicio está en el estado esperado
    modifier inState(ElectionState _state) {
        require(electionState == _state, "El comicio no esta en el estado correcto");
        _;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @notice Despliega el contrato y establece al deployer como owner
    constructor() {
        owner = msg.sender;
        electionState = ElectionState.Created;
    }

    // ──────────────────────────────────────────────
    // Gestión de Candidatos (solo en estado Created)
    // ──────────────────────────────────────────────

    /**
     * @notice Agrega un candidato a la elección
     * @param _firstName Nombre del candidato
     * @param _lastName Apellido del candidato
     * @param _listName Lista a la que pertenece
     * @param _position Puesto al que postula
     * @dev Solo el owner puede agregar candidatos y solo antes de abrir la votación
     */
    function addCandidate(
        string calldata _firstName,
        string calldata _lastName,
        string calldata _listName,
        string calldata _position
    ) external onlyOwner inState(ElectionState.Created) {
        // CHECKS
        require(bytes(_firstName).length > 0, "El nombre del candidato no puede estar vacio");
        require(bytes(_lastName).length > 0, "El apellido del candidato no puede estar vacio");

        // EFFECTS
        candidates.push(Candidate({
            firstName: _firstName,
            lastName: _lastName,
            listName: _listName,
            position: _position,
            voteCount: 0
        }));

        // Evento para auditoría
        emit CandidateAdded(candidates.length - 1, _firstName, _lastName, _listName, _position);
    }

    /**
     * @notice Devuelve la cantidad total de candidatos registrados
     * @return Número de candidatos
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    // ──────────────────────────────────────────────
    // US-02: Registro de Votantes (Whitelisting)
    // ──────────────────────────────────────────────

    /**
     * @notice Registra una dirección en el padrón electoral
     * @param _voter Dirección pública del votante
     * @dev Solo ejecutable por el owner. Puede hacerse en Created o Open.
     *      Falla si la dirección ya está registrada (previene duplicados).
     */
    function authorizeVoter(address _voter) external onlyOwner {
        // CHECKS — input validation
        require(_voter != address(0), "Direccion invalida");
        require(!voters[_voter].isAuthorized, "El votante ya esta autorizado");
        require(
            electionState == ElectionState.Created || electionState == ElectionState.Open,
            "No se pueden registrar votantes con el comicio cerrado"
        );

        // EFFECTS
        voters[_voter].isAuthorized = true;
        totalRegisteredVoters++;

        // Evento
        emit VoterAuthorized(_voter);
    }

    // ──────────────────────────────────────────────
    // US-07: Control del Comicio (Apertura y Cierre)
    // ──────────────────────────────────────────────

    /**
     * @notice Abre la votación (Created → Open)
     * @dev Requiere que haya al menos un candidato registrado.
     *      Transición unidireccional: no se puede volver a Created.
     */
    function openVoting() external onlyOwner inState(ElectionState.Created) {
        // CHECKS
        require(candidates.length > 0, "Debe haber al menos un candidato");

        // EFFECTS
        electionState = ElectionState.Open;
        emit ElectionStateChanged(ElectionState.Open);
    }

    /**
     * @notice Cierra la votación (Open → Closed) — IRREVERSIBLE
     * @dev Una vez cerrado, no se aceptan más votos ni se puede reabrir.
     *      Cumple el criterio de "confirmación de seguridad doble" desde el frontend.
     */
    function closeVoting() external onlyOwner inState(ElectionState.Open) {
        // EFFECTS
        electionState = ElectionState.Closed;
        emit ElectionStateChanged(ElectionState.Closed);
    }

    // ──────────────────────────────────────────────
    // US-03: Verificación de Estado de Votante
    // ──────────────────────────────────────────────

    /**
     * @notice Consulta si una dirección está autorizada para votar
     * @param _voter Dirección a consultar
     * @return true si está en el padrón
     */
    function isVoterAuthorized(address _voter) external view returns (bool) {
        return voters[_voter].isAuthorized;
    }

    /**
     * @notice Consulta si una dirección ya emitió su voto
     * @param _voter Dirección a consultar
     * @return true si ya votó
     */
    function hasVoterVoted(address _voter) external view returns (bool) {
        return voters[_voter].hasVoted;
    }

    // ──────────────────────────────────────────────
    // US-04 y US-05: Emisión de Voto + Unicidad
    // ──────────────────────────────────────────────

    /**
     * @notice Emite un voto por un candidato
     * @param _candidateId Índice del candidato en el array
     * @dev Patrón CEI (Checks-Effects-Interactions):
     *   1. CHECKS: estado del comicio, autorización, voto previo, candidato válido
     *   2. EFFECTS: marcar hasVoted, incrementar contadores
     *   3. No hay INTERACTIONS externas (no hay llamadas a otros contratos)
     */
    function vote(uint256 _candidateId) external inState(ElectionState.Open) {
        // ── CHECKS ──
        Voter storage sender = voters[msg.sender];
        require(sender.isAuthorized, "No estas en el padron");
        require(!sender.hasVoted, "Ya has emitido tu voto");
        require(_candidateId < candidates.length, "Candidato invalido");

        // ── EFFECTS ──
        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        // Evento para auditoría (US-08: permite trazar el TxHash)
        emit VoteCast(msg.sender, _candidateId);
    }

    // ──────────────────────────────────────────────
    // US-06: Consulta de Resultados en Tiempo Real
    // ──────────────────────────────────────────────

    /**
     * @notice Retorna los detalles y cantidad de votos de un candidato
     * @param _candidateId Índice del candidato
     * @return firstName Nombre del candidato
     * @return lastName Apellido del candidato
     * @return listName Lista del candidato
     * @return position Puesto del candidato
     * @return voteCount Votos recibidos
     * @dev Función view → sin costo de gas, accesible para cualquier persona
     */
    function getCandidate(uint256 _candidateId) external view returns (
        string memory firstName,
        string memory lastName,
        string memory listName,
        string memory position,
        uint256 voteCount
    ) {
        require(_candidateId < candidates.length, "Candidato invalido");
        Candidate storage c = candidates[_candidateId];
        return (c.firstName, c.lastName, c.listName, c.position, c.voteCount);
    }

    /**
     * @notice Retorna todos los candidatos con sus votos (para la vista de resultados)
     * @return firstNames Array de nombres
     * @return lastNames Array de apellidos
     * @return listNames Array de listas
     * @return positions Array de puestos
     * @return voteCounts Array de votos
     * @dev Útil para que el frontend renderice los resultados de una sola llamada
     */
    function getAllResults() external view returns (
        string[] memory firstNames,
        string[] memory lastNames,
        string[] memory listNames,
        string[] memory positions,
        uint256[] memory voteCounts
    ) {
        uint256 len = candidates.length;
        firstNames = new string[](len);
        lastNames = new string[](len);
        listNames = new string[](len);
        positions = new string[](len);
        voteCounts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            firstNames[i] = candidates[i].firstName;
            lastNames[i] = candidates[i].lastName;
            listNames[i] = candidates[i].listName;
            positions[i] = candidates[i].position;
            voteCounts[i] = candidates[i].voteCount;
        }
    }
}