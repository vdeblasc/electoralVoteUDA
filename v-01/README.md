# 🗳️ electoralVoteUDA — Sistema de Votación Blockchain

> **Proyecto Integrador** — Base de Datos Avanzada, Universidad del Azuay (UDA)

Sistema de votación descentralizado sobre Ethereum. Los votos se registran como transacciones inmutables en la blockchain, garantizando transparencia, unicidad y auditabilidad pública.

---

## 📋 Tabla de Contenidos

- [Tecnologías Requeridas](#-tecnologías-requeridas)
- [Instalación Local (Paso a Paso)](#-instalación-local-paso-a-paso)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Flujo de Datos del Sistema](#-flujo-de-datos-del-sistema)
- [Comandos Útiles](#-comandos-útiles)
- [Configuración de MetaMask](#-configuración-de-metamask)
- [Historias de Usuario Cubiertas](#-historias-de-usuario-cubiertas)
- [Notas de Seguridad](#-notas-de-seguridad)
- [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🛠 Tecnologías Requeridas

Instalar **antes** de clonar el repositorio:

| Software | Versión | Descarga | Notas |
|----------|---------|----------|-------|
| **Node.js** | LTS (v20+) | [nodejs.org](https://nodejs.org/) | Instalar con la opción "Add to PATH" marcada |
| **Git** | Última | [git-scm.com](https://git-scm.com/) | Usar Git Bash o PowerShell |
| **MetaMask** | Extensión | [metamask.io](https://metamask.io/) | Instalar en Chrome o Firefox |

### Verificar instalación

Abrir **PowerShell** y ejecutar:

```powershell
node --version   # Debe mostrar v20.x.x o superior
npm --version    # Debe mostrar 10.x.x o superior
git --version    # Debe mostrar git version 2.x.x
```

> ⚠️ **Windows:** Si `node` no se reconoce, reiniciar PowerShell después de instalar Node.js. Si persiste, verificar que la ruta esté en la variable de entorno `PATH`.

---

## 🚀 Instalación Local (Paso a Paso)

### 1. Clonar el repositorio

```powershell
git clone https://github.com/<tu-organizacion>/electoralVoteUDA.git
cd electoralVoteUDA/v-01
```

### 2. Instalar dependencias

```powershell
npm install
```

> Esto instala Hardhat 3, ethers.js, Mocha, Chai y todas las herramientas del toolbox.

### 3. Compilar el contrato

```powershell
npx hardhat compile
```

Si la compilación es exitosa, verás los artefactos generados en la carpeta `/artifacts`.

### 4. Levantar el nodo local

```powershell
npx hardhat node
```

Esto inicia una blockchain local en `http://127.0.0.1:8545` con **20 cuentas de prueba** precargadas con ETH ficticio. **Dejar esta terminal abierta.**

### 5. Conectar MetaMask (ver sección [Configuración de MetaMask](#-configuración-de-metamask))

### 6. Ejecutar tests

En **otra terminal** (dejar el nodo corriendo):

```powershell
npx hardhat test
```

---

## 📂 Estructura de Carpetas

```
v-01/
├── contracts/           ← Smart Contracts (Solidity)
│   └── Voting.sol       ← Contrato principal de votación
│
├── scripts/             ← Scripts de despliegue y utilidades
│   └── (deploy.ts)      ← Script para desplegar el contrato (por crear)
│
├── test/                ← Tests automatizados
│   └── (Voting.test.ts) ← Tests del contrato (por crear)
│
├── frontend/            ← Aplicación web (React/Next.js — por definir)
│
├── artifacts/           ← ⚙️ Auto-generado al compilar (NO editar)
│   └── contracts/       ← ABI y bytecode compilados
│
├── hardhat.config.ts    ← Configuración de Hardhat (redes, compilador)
├── package.json         ← Dependencias del proyecto
├── tsconfig.json        ← Configuración de TypeScript
├── .env                 ← Variables de entorno (NUNCA subir a Git)
└── .gitignore           ← Archivos excluidos del repositorio
```

### ¿Qué es cada carpeta?

| Carpeta | Propósito |
|---------|-----------|
| `contracts/` | Aquí vive el código Solidity. Hardhat compila todo `.sol` dentro de esta carpeta. |
| `scripts/` | Scripts TypeScript para desplegar contratos o ejecutar tareas administrativas. |
| `test/` | Tests automatizados usando Mocha + Chai + ethers.js. Se ejecutan contra una blockchain efímera. |
| `artifacts/` | Generado automáticamente por `npx hardhat compile`. Contiene el **ABI** (interfaz del contrato) que el frontend necesita para comunicarse con la blockchain. |
| `frontend/` | Aplicación web que se conectará a MetaMask y al contrato desplegado. |

---

## 🔄 Flujo de Datos del Sistema

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Votante    │───▶│   MetaMask   │───▶│   Frontend       │───▶│  Hardhat    │
│  (Navegador) │    │  (Wallet)    │    │  (React/HTML)    │    │  Node Local │
└──────────────┘    └──────────────┘    └──────────────────┘    └─────────────┘
                          │                      │                      │
                    Firma la Tx            Lee ABI de              Ejecuta la Tx
                    con clave             /artifacts y            en la EVM local
                    privada               envía Tx vía            y mina el bloque
                                          ethers.js
                                                                       │
                                                                       ▼
                                                                ┌─────────────┐
                                                                │  Voting.sol │
                                                                │  (Contrato) │
                                                                └─────────────┘
```

### Paso a paso:

1. **Votante** abre la aplicación web en el navegador.
2. **MetaMask** detecta la solicitud de conexión y le pide al usuario aprobar el acceso a su dirección pública.
3. El **Frontend** (usando la librería `ethers.js`) lee el ABI del contrato desde `/artifacts` y crea una instancia del contrato.
4. Cuando el votante selecciona un candidato y presiona "Votar":
   - El Frontend construye la transacción `vote(candidateId)`.
   - **MetaMask** le pide al usuario que **firme** la transacción con su clave privada.
   - La transacción firmada se envía al **nodo de Hardhat** (`http://127.0.0.1:8545`).
5. El nodo ejecuta la transacción en la **EVM** (máquina virtual de Ethereum), actualiza el estado del contrato `Voting.sol`, y mina el bloque.
6. El Frontend recibe la **confirmación** (receipt) con el `TxHash`, que se muestra al usuario como comprobante auditable.

### Funciones de solo lectura (sin gas)

Las consultas como "ver resultados" (`getAllResults()`) o "¿ya voté?" (`hasVoterVoted()`) son funciones `view` → se ejecutan localmente sin crear transacciones ni gastar gas.

---

## ⌨️ Comandos Útiles

### Día a día

| Comando | Descripción |
|---------|-------------|
| `npx hardhat compile` | Compila los contratos de `/contracts`. Genera ABIs en `/artifacts`. |
| `npx hardhat test` | Ejecuta todos los tests de `/test`. |
| `npx hardhat node` | Levanta un nodo Ethereum local en `http://127.0.0.1:8545`. |
| `npx hardhat clean` | Borra `/artifacts` y caché de compilación. Útil si hay errores raros. |

### Despliegue

```powershell
# Levantar nodo en Terminal 1
npx hardhat node

# Desplegar en Terminal 2 (cuando tengamos el script de deploy)
npx hardhat run scripts/deploy.ts --network localNode
```

### Consola interactiva

```powershell
# Abrir consola de Hardhat conectada al nodo local
npx hardhat console --network localNode
```

Desde la consola puedes interactuar directamente con el contrato:

```javascript
const voting = await ethers.getContractAt("Voting", "<DIRECCIÓN_DEL_CONTRATO>");
await voting.getCandidateCount();
```

---

## 🦊 Configuración de MetaMask

### 1. Agregar la red local

1. Abrir MetaMask → ícono de redes (arriba) → **"Agregar red manualmente"**
2. Completar:

| Campo | Valor |
|-------|-------|
| Nombre de la red | `Hardhat Local` |
| URL de RPC | `http://127.0.0.1:8545` |
| ID de cadena | `1337` |
| Símbolo de moneda | `ETH` |

3. Guardar.

### 2. Importar cuenta de prueba

Al ejecutar `npx hardhat node`, la terminal muestra 20 cuentas con sus claves privadas. Para importar una:

1. Copiar la **Private Key** de la Account #0 (es el owner/admin).
2. MetaMask → ícono de perfil → **"Importar cuenta"** → pegar la clave privada.
3. La cuenta aparecerá con **10,000 ETH** de prueba.

> ⚠️ **NUNCA** uses estas claves privadas en redes reales (Mainnet, Sepolia). Son públicas y cualquiera puede acceder a ellas.

### 3. Importar cuenta de votante

Repetir el paso anterior con la Account #1, #2, etc. Cada compañero puede importar una cuenta diferente para simular votantes distintos.

---

## 📖 Historias de Usuario Cubiertas

El contrato `Voting.sol` implementa la base para las siguientes historias de usuario:

| US | Descripción | Estado |
|----|-------------|--------|
| US-01 | Conexión de Wallet Web3 | 🔲 Frontend pendiente |
| US-02 | Registro de Votantes (Whitelisting) | ✅ `authorizeVoter()` |
| US-03 | Verificación de Estado de Votante | ✅ `isVoterAuthorized()`, `hasVoterVoted()` |
| US-04 | Emisión de Voto On-Chain | ✅ `vote()` |
| US-05 | Garantía de Unicidad (Un solo voto) | ✅ `require(!hasVoted)` en `vote()` |
| US-06 | Consulta de Resultados en Tiempo Real | ✅ `getCandidate()`, `getAllResults()` |
| US-07 | Control del Comicio (Apertura y Cierre) | ✅ `openVoting()`, `closeVoting()` |
| US-08 | Auditoría y Trazabilidad | ✅ Eventos: `VoteCast`, `VoterAuthorized`, etc. |

---

## 🔒 Notas de Seguridad

El contrato aplica las siguientes prácticas de seguridad (documentadas en `.agents/skills/solidity-security/`):

- **Checks-Effects-Interactions (CEI):** Toda función de escritura valida primero, actualiza estado después, y no hace llamadas externas.
- **Control de acceso:** Modifier `onlyOwner` para funciones administrativas.
- **Máquina de estados:** `ElectionState` con transiciones unidireccionales (Created → Open → Closed).
- **Protección contra overflow:** Solidity 0.8.24 tiene checks nativos de overflow/underflow.
- **Validación de inputs:** Direcciones no-zero, candidatos existentes, nombres no vacíos.
- **Eventos para auditoría:** Cada acción importante emite un evento indexado para rastreo off-chain.
- **Inmutabilidad del owner:** `address public immutable owner` previene cambios accidentales.

---

## ❓ Preguntas Frecuentes

### ¿El proyecto tiene algún costo?

**No.** Todo corre en un nodo local de Hardhat. No se conecta a ninguna red real ni requiere ETH verdadero.

### ¿Necesito internet para desarrollar?

Solo para el `npm install` inicial y descargar dependencias. Después de eso, todo funciona offline.

### ¿Qué pasa si cierro la terminal del nodo?

Se pierden todos los datos de la blockchain local (contratos desplegados, votos, etc.). Al reiniciar el nodo, hay que volver a desplegar el contrato.

### Me aparece "Nonce too high" en MetaMask

Esto pasa cuando reinicias el nodo de Hardhat pero MetaMask recuerda transacciones anteriores. Solución:
1. MetaMask → Configuración → Avanzado → **"Borrar datos de actividad"**.

### Error `ENOENT` o problemas de rutas en Windows

- Asegurarse de usar **PowerShell** (no CMD) o **Git Bash**.
- No usar rutas con espacios en el nombre de carpetas.
- Si persiste, eliminar `node_modules` y volver a ejecutar `npm install`.

### ¿Puedo trabajar con otro editor que no sea VS Code?

Sí, pero VS Code tiene las mejores extensiones para Solidity (resaltado, autocompletado, detección de errores).

---

## 👥 Equipo

Equipo de 6 integrantes — Cátedra de Base de Datos Avanzada, Universidad del Azuay.

---

## 📄 Licencia

MIT — Proyecto académico.
