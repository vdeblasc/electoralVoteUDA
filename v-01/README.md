🚀 Arquitectura y Tecnologías
Blockchain: Ethereum (compatible con EVM).

Smart Contracts: Solidity.

Entorno de Desarrollo: Hardhat (Suite de pruebas y nodo local).

Frontend: Integración mediante Ethers.js para comunicación Web3.

Wallet: MetaMask (Gestión de identidad y firma de transacciones).

🛠️ Estructura del Repositorio
/contracts: Contiene la lógica de negocio on-chain. Aquí se define quién puede votar, cómo se cuentan los votos y la seguridad para evitar el doble voto.

/test: Suite de validación técnica. Cada Historia de Usuario (US) tiene un test asociado para garantizar que el contrato no falle.

/scripts: Automatización del despliegue en redes locales o testnets.

/frontend: Interfaz de usuario que conecta al ciudadano con el Smart Contract.

🔄 Flujo de Datos
El flujo del sistema se divide en cuatro capas de interacción:

Capa de Identidad (MetaMask): El usuario conecta su wallet. El sistema obtiene su dirección pública para validar si está en el "padrón" (whitelist).

Capa de Interfaz (Frontend): Se consultan las funciones view del contrato (gratuitas) para mostrar candidatos y resultados en tiempo real.

Capa de Ejecución (Smart Contract): Al votar, el usuario firma una transacción. Hardhat/Blockchain valida:

¿El comicio está abierto?

¿El usuario está autorizado?

¿Ya votó anteriormente?

Capa de Persistencia (Ledger): Una vez minada la transacción, el estado de la votación cambia permanentemente y se genera un TxHash inmutable.

💻 Instalación y Uso
Clonar el repositorio.

Instalar dependencias: npm install

Compilar contratos: npx hardhat compile

Correr nodo local: npx hardhat node

Desplegar: npx hardhat run scripts/deploy.js --network localhost

📝 Notas de Desarrollo Académico
Costo 0: El proyecto utiliza redes locales y Testnets (Sepolia), por lo que no requiere inversión económica.

Privacidad: Las direcciones son públicas, pero el voto es inmutable una vez registrado en el bloque.