# 🗳️ electoralVoteUDA — Sistema de Votación Blockchain

Proyecto académico de votación electrónica sobre Ethereum local. El smart contract `Voting.sol` funciona como fuente de verdad: administra candidatos, padrón electoral, apertura/cierre del comicio, emisión de voto único y resultados públicos.

La versión actual incorpora una interfaz React/TypeScript con identidad visual propia: **Aconcagua Civic Ledger**, pensada como una urna digital moderna, clara para usuarios no técnicos y separada por rol administrador/votante.

---

## Qué incluye

- **Smart contract Solidity** con control de acceso, padrón, candidatos con nombre/apellido/lista/cargo y máquina de estados `Created → Open → Closed`.
- **Frontend React + TypeScript + Vite** conectado con MetaMask mediante `ethers`.
- **Panel administrador** para armar boleta, empadronar votantes, abrir y cerrar la elección.
- **Panel votante** para verificar padrón, votar y entender cuándo debe confirmar en MetaMask.
- **Panel de resultados** con participación, votos totales y barras por candidato.
- **Mensajes humanos de error/éxito** para evitar errores crudos de blockchain.

---

## Requisitos

| Herramienta | Uso |
|---|---|
| Node.js LTS | Ejecutar Hardhat, Vite y scripts npm |
| MetaMask | Firmar transacciones desde el navegador |
| Git | Clonar y versionar el proyecto |

> Todo corre en red local. No uses ETH real ni redes públicas para las cuentas de prueba de Hardhat.

---

## Instalación

Desde la raíz del repositorio:

```powershell
cd v-01
npm install
cd frontend
npm install
```

---

## Compilar y probar contrato

```powershell
cd v-01
npx hardhat compile
npx hardhat test
```

Si Hardhat muestra un bloqueo temporal del compilador (`MultiProcessMutexTimeoutError`), ejecutá primero:

```powershell
npx hardhat compile
npx hardhat test --no-compile
```

---

## Levantar blockchain local

En una terminal:

```powershell
cd v-01
npx hardhat node
```

Hardhat expone la red local en:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Moneda: `ETH`

Dejá esta terminal abierta mientras uses la app.

---

## Deploy local del contrato

En otra terminal:

```powershell
cd v-01
npx hardhat run scripts/deploy.ts --network localNode
```

El script despliega `Voting`, empadrona una cuenta de prueba y deja la elección en estado **Created** para que el administrador cargue candidatos desde el frontend.

Copiá la dirección impresa y actualizá:

```env
# v-01/frontend/.env
VITE_CONTRACT_ADDRESS="0x..."
```

---

## Configurar MetaMask

1. Agregar red manual:
   - Nombre: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Símbolo: `ETH`
2. Importar la cuenta administradora con la private key de `Account #0` del nodo Hardhat.
3. Importar otra cuenta de prueba para simular votante.
4. Si reiniciás Hardhat y MetaMask queda con nonces viejos: MetaMask → Configuración → Avanzado → **Borrar datos de actividad**.

---

## Correr frontend

```powershell
cd v-01/frontend
npm run dev
```

Abrí la URL que muestra Vite, normalmente:

```text
http://localhost:5173
```

Para generar build de producción:

```powershell
npm run build
```

Para revisar lint:

```powershell
npm run lint
```

---

## Cómo usar la app

### Administrador

1. Conectar MetaMask con la cuenta que desplegó el contrato.
2. En **Armar boleta**, agregar candidatos con nombre, apellido, lista y cargo.
3. En **Empadronar votante**, pegar direcciones públicas `0x...` de votantes.
4. En **Ciclo del comicio**, abrir la votación cuando la boleta esté lista.
5. Cerrar el comicio al terminar. El cierre es irreversible y congela resultados.

### Votante

1. Conectar MetaMask con una cuenta empadronada.
2. Esperar a que la elección esté en estado **Abierto**.
3. Elegir candidato y confirmar la transacción en MetaMask.
4. La app muestra feedback de confirmación y luego impide votar otra vez con la misma wallet.
5. Al finalizar, se ve el ganador o empate técnico.

---

## Estructura resumida

```text
v-01/
├── contracts/
│   └── Voting.sol              # contrato electoral
├── scripts/
│   └── deploy.ts               # deploy local y padrón inicial
├── test/
│   └── Voting.test.ts          # pruebas del contrato
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # shell, conexión wallet y lectura de contrato
│   │   ├── App.css             # layout principal y diseño visual
│   │   ├── index.css           # tokens del sistema visual
│   │   ├── components/
│   │   │   ├── AdminPanel.tsx  # acciones administrativas
│   │   │   ├── VoterPanel.tsx  # boleta y voto
│   │   │   ├── ResultsPanel.tsx# resultados públicos
│   │   │   ├── StatusBadge.tsx # estado del comicio
│   │   │   └── components.css  # estilos de componentes
│   │   ├── constants/
│   │   │   └── contract.ts     # dirección y ABI mínimo
│   │   └── utils/
│   │       └── transactionMessages.ts # errores humanos y helpers UI
│   └── .env                    # VITE_CONTRACT_ADDRESS
├── artifacts/                  # generado por Hardhat, no editar manualmente
├── cache/                      # generado por Hardhat, no editar manualmente
└── types/                      # tipos generados por Hardhat
```

---

## Mejoras UX/UI agregadas

- Identidad visual **Aconcagua Civic Ledger**: urna digital, credencial cívica, acentos cian/oro y fondo tecnológico institucional.
- Dashboard con jerarquía clara: estado del comicio, rol, candidatos, padrón y resultados.
- Diferenciación fuerte entre **administrador** y **votante**.
- Estados de transacción: “esperando MetaMask”, “transacción enviada”, “confirmado”.
- Errores traducidos a lenguaje humano: padrón, doble voto, red incorrecta, cancelación en MetaMask, fondos insuficientes.
- Responsive para desktop/mobile y foco visible en inputs/botones.
- Eliminación de estilos inline en flujos principales para mantener CSS consistente.
- Resultados con participación y barras porcentuales sin revelar votos individuales.

---

## Problemas comunes

| Problema | Solución |
|---|---|
| MetaMask no conecta | Desbloquear extensión, recargar página y verificar red Hardhat Local |
| “Red incorrecta” | Cambiar a Chain ID `31337` |
| Contrato no responde | Verificar que `npx hardhat node` esté activo y que `VITE_CONTRACT_ADDRESS` sea la dirección desplegada actual |
| Votante no habilitado | El administrador debe empadronar la dirección pública del votante |
| Ya votaste | El contrato permite un solo voto por wallet |
| Nonce/actividad vieja | Borrar datos de actividad en MetaMask tras reiniciar Hardhat |

---

## Comandos útiles

```powershell
# Contrato
cd v-01
npm run compile
npm test
npm run node:local
npm run deploy:local

# Frontend
cd v-01/frontend
npm run dev
npm run build
npm run lint
```
