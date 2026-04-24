# Historias de Usuario — Sistema de Votación Blockchain (UDA)

Historias de usuario extraídas del análisis del proyecto integrador para la cátedra de Base de Datos Avanzada.

---

## Módulo: Autenticación y Registro

### US-01 — Conexión de Wallet Web3

> Como votante, quiero conectar mi wallet de MetaMask a la plataforma para poder interactuar con el sistema de votación de forma segura.

**Criterios de aceptación:**
- El sistema debe detectar si la extensión MetaMask está instalada en el navegador.
- Al hacer clic en "Conectar Wallet", el sistema debe solicitar permisos de acceso a la dirección pública.
- Una vez conectada, se debe mostrar la dirección de la wallet (truncada) en la interfaz.
- El sistema debe validar que el usuario esté conectado a la red correcta (Sepolia/Hardhat); de lo contrario, mostrar una alerta.

---

### US-02 — Registro de Votantes (Whitelisting)

> Como administrador electoral (Owner), quiero registrar las direcciones públicas de los votantes autorizados en el contrato para definir el padrón electoral oficial.

**Criterios de aceptación:**
- Solo la dirección que desplegó el contrato (Owner) tiene permisos para ejecutar esta función.
- El sistema debe permitir el ingreso de una dirección `address` de Ethereum.
- El contrato debe almacenar la relación entre la dirección y su estado de autorización.
- Si una dirección ya está registrada, la transacción debe fallar para evitar duplicidad.
- El sistema responde con la confirmación de la transacción en la blockchain.

---

## Módulo: Proceso de Votación

### US-03 — Verificación de Estado de Votante

> Como votante, quiero ver si mi dirección está habilitada para votar al entrar al sistema para confirmar que mi registro fue exitoso.

**Criterios de aceptación:**
- Al cargar la página, el sistema debe consultar el estado `isAuthorized` de la wallet conectada.
- Si el usuario está autorizado, se habilita la interfaz de selección de candidatos.
- Si el usuario NO está autorizado, el sistema bloquea el módulo de votación y muestra un mensaje informativo.

---

### US-04 — Emisión de Voto On-Chain

> Como votante habilitado, quiero seleccionar un candidato y firmar la transacción para que mi voto se registre de manera inmutable en la blockchain.

**Criterios de aceptación:**
- El usuario debe seleccionar una opción de la lista de candidatos disponibles.
- Al votar, se debe disparar una solicitud de firma de transacción en MetaMask.
- El voto se registra mediante la ejecución de la función correspondiente en el Smart Contract.
- El sistema debe esperar la confirmación del minado de la transacción para informar el éxito del voto.

---

### US-05 — Garantía de Unicidad (Un solo voto)

> Como administrador electoral, quiero que el contrato rechace automáticamente cualquier segundo intento de voto desde una misma dirección para garantizar la integridad de la elección.

**Criterios de aceptación:**
- El contrato debe cambiar el estado `hasVoted` a `true` inmediatamente después de procesar el primer voto.
- Cualquier llamada posterior a la función de votación desde la misma dirección debe resultar en un `revert` de la transacción.
- El front-end debe deshabilitar visualmente el botón de votación si el usuario ya ha participado.

---

## Módulo: Administración y Resultados

### US-06 — Consulta de Resultados en Tiempo Real

> Como auditor público o votante, quiero visualizar el recuento de votos extraído directamente del contrato para verificar la transparencia de la elección.

**Criterios de aceptación:**
- La interfaz debe disponer de una vista de "Resultados" abierta a todo el público.
- Los datos se obtienen mediante funciones de solo lectura (`view`), por lo que no requieren firma de wallet ni gasto de gas.
- La sumatoria de votos por candidato debe coincidir exactamente con el total de votos emitidos registrados en el contrato.

---

### US-07 — Control del Comicio (Apertura y Cierre)

> Como administrador electoral, quiero iniciar y finalizar la votación manualmente para evitar la recepción de votos fuera del horario establecido.

**Criterios de aceptación:**
- El sistema permite al Administrador cambiar el estado del comicio (Inactivo -> Activo -> Finalizado).
- El módulo de votación debe validar el estado del contrato antes de permitir cualquier transacción.
- Una vez que el estado es "Finalizado", el contrato debe bloquear permanentemente la recepción de nuevos votos.
- Requiere una confirmación de seguridad doble por parte del administrador para ejecutar el cierre definitivo.

---

## Transversales

### US-08 — Auditoría y Trazabilidad (Hash de Transacción)

> Como votante, quiero recibir el hash de mi transacción después de votar para tener un comprobante técnico de mi participación auditable en Etherscan.

**Criterios de aceptación:**
- Tras la confirmación de la red, se debe mostrar un modal con el ID de la transacción (TxHash).
- Se debe incluir un enlace directo al explorador de bloques (ej. Etherscan) para verificar la persistencia de los datos.
