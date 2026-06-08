# Frontend — Aconcagua Civic Ledger

Interfaz React/TypeScript para el sistema `electoralVoteUDA`. Está diseñada como una urna digital moderna: clara para usuarios no técnicos, con rol administrador/votante visible, feedback de MetaMask y resultados públicos.

## Requisitos

- Node.js LTS
- MetaMask
- Contrato `Voting.sol` desplegado en Hardhat Local

## Variables de entorno

Crear o actualizar `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS="0x..."
```

La dirección sale del deploy:

```powershell
cd ../
npx hardhat run scripts/deploy.ts --network localNode
```

## Desarrollo

```powershell
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

## Validación

```powershell
npm run build
npm run lint
```

## Estructura visual

- `src/App.tsx`: conexión wallet, lectura del contrato, estado global y layout.
- `src/components/AdminPanel.tsx`: formulario de candidatos, empadronamiento y control del comicio.
- `src/components/VoterPanel.tsx`: estado del votante, boleta y acción de voto.
- `src/components/ResultsPanel.tsx`: conteo público y participación.
- `src/components/StatusBadge.tsx`: estado visual Created/Open/Closed.
- `src/utils/transactionMessages.ts`: helpers para direcciones cortas y errores entendibles.
- `src/index.css` y `src/App.css`: tokens, layout y estética Aconcagua Civic Ledger.

## Uso esperado

1. Administrador conecta la cuenta owner.
2. Agrega candidatos y empadrona votantes.
3. Abre la votación.
4. Votante empadronado conecta MetaMask y vota.
5. Administrador cierra el comicio y todos ven resultados agregados.
