🗳️ Blockchain-Based Voting System (dApp)
A Decentralized Web Application (dApp) built on the Ethereum network, designed to provide an immutable, transparent, and cryptographically secure digital voting mechanism. This project was developed as part of the Advanced Database course at Universidad del Aconcagua.

🚀 Project Overview
The system mitigates risks such as electoral fraud, ballot tampering, and identity theft by executing business logic through Smart Contracts and securing interactions via asymmetric transaction signing. It manages multiple-choice elections within a closed registry (Whitelisting).

🛠️ Tech Stack
Blockchain: Solidity (Smart Contracts)
Network: Ethereum (Sepolia Testnet / Hardhat)
Web3 Integration: Ethers.js / MetaMask
Frontend: React.js
Development Environment: Hardhat

📋 Key Features
Web3 Authentication: Secure login using digital wallets (MetaMask).
Closed Registry (Whitelisting): Only public addresses authorized by the Electoral Administrator can cast a vote.
On-Chain Immutability: Once a vote is cast, it is recorded on the blockchain and cannot be modified or deleted.
Real-Time Transparency: Publicly auditable vote counting extracted directly from the contract state.
Election Control: Administrative functions to manually start and finalize the voting period.

🏗️ Architecture & Roles
Electoral Administrator (Owner): Responsible for contract deployment, whitelisting voters, and managing election states.
Voter: Authorized end-user who interacts with the contract to sign and emit their vote.
Auditor / General Public: Any user can verify the results and transaction history on-chain.

👥 The Team (Scrum)
Product Owner: Valentino De Blas
Scrum Master: Lautaro Olmedo
Development Team: Santino Piantini, Francisco Guerrero, Santino Sbriglio, Matias Trifiro, Tomas Peireti, Gonzalo Gallardo.
