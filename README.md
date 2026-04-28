# 🗳️ Secure Voting System: Blockchain-Based Blinded Elections

A full-stack decentralized application (dApp) for secure, transparent, and anonymous voting. This project utilizes a **Commit-Reveal** cryptographic scheme and a **Gasless Relayer** to ensure voter privacy and a seamless user experience.

---

## Tech Stack

- **Blockchain:** Solidity, Hardhat, Ethers.js
- **Backend (Relayer):** Node.js, Express, EIP-712 Structured Data Signing
- **Frontend:** React.js (TypeScript), Vite, Tailwind CSS
- **Wallet:** MetaMask integration

---

## Key Features

- **Blinded Commit-Reveal:** Votes are submitted as cryptographic hashes during the "Commit" phase, keeping the choice hidden until the "Reveal" phase.
- **Gasless Transactions:** Implements a **Relayer Service** that sponsors gas fees for the initial vote commitment, so users don't need ETH to start.
- **Tamper-Proof Ledger:** All commitments and reveals are permanently recorded on the local Hardhat network.
- **Smart Sync Architecture:** Automated synchronization between Smart Contract deployments, the Backend API, and the Frontend UI.
- **Real-time Audit Hub:** A public dashboard where voters can verify that their commitment hash was successfully recorded on-chain.

---

## Project Structure

```text
├── contracts/              # Solidity contracts & Hardhat configuration
│   ├── artifacts/          # Compiled contract artifacts
│   ├── cache/              # Hardhat cache
│   ├── contracts/          # Source contracts
│   ├── scripts/            # Deployment scripts
│   ├── test/               # Contract tests
│   └── hardhat.config.js   # Hardhat configuration
├── backend/                # Express server & Gasless Relayer logic
│   ├── src/                # Backend source code
│   └── data/               # Data storage
├── frontend/               # React + TypeScript frontend application
│   ├── public/             # Static assets
│   ├── src/                # Frontend source code
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── web3/           # Web3 utilities
│   └── vite.config.ts      # Vite configuration
├── deployments/            # Deployment configurations
└── package.json            # Root package.json