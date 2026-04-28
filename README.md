# Secure Voting System: Blockchain-Based Blinded Elections

A full-stack decentralized application (dApp) for secure, transparent, and anonymous voting. This project uses a **Commit-Reveal cryptographic scheme** and a **Gasless Relayer** to ensure voter privacy and a seamless user experience.

---

## 🚀 Key Features

- **Blinded Commit-Reveal:** Votes are submitted as cryptographic hashes during the Commit phase, keeping choices hidden until the Reveal phase.  
- **Gasless Transactions:** Implements a Relayer Service that sponsors gas fees for vote commitment using **EIP-712 structured data signing**.  
- **Tamper-Proof Ledger:** All vote commitments and reveals are recorded on the Ethereum blockchain (Hardhat network).  
- **Real-time Audit Hub:** Public dashboard where voters can verify their commitment was recorded on-chain.  
- **Smart Sync Architecture:** Automated synchronization between Smart Contract deployments, Backend API, and Frontend UI.  

---

## 🛠️ Tech Stack

### Blockchain Layer
- Solidity – Smart contract logic  
- Hardhat – Local blockchain network & deployment scripts  
- Ethers.js – Blockchain interaction  

### Backend (Relayer)
- Node.js / Express – API for sponsoring transactions and serving configuration  
- EIP-712 – Structured data signing for secure voter authorization  

### Frontend
- React.js (TypeScript) – Interactive UI  
- Tailwind CSS – Modern responsive styling  
- Vite – Fast frontend tooling  

---

## 📂 Project Structure

```plaintext
├── contracts/      # Solidity contracts & Hardhat configuration
├── backend/        # Express server & Gasless Relayer logic
└── frontend/       # React + TypeScript frontend application

⚙️ Installation & Setup

Follow these steps to run the project locally:

1. Prerequisites
Node.js (v18+)
MetaMask Browser Extension
2. Blockchain Setup
cd contracts
npm install
npx hardhat node
3. Deploy Smart Contracts

Open a new terminal:

cd contracts
npx hardhat run scripts/deploy.js --network localhost
4. Backend Configuration
cd backend
npm install
# Configure .env with SPONSOR_PRIVATE_KEY and ALLOWLIST
npm run dev
5. Frontend Launch
cd frontend
npm install
npm run dev
📋 How It Works (Voting Flow)
Commit Phase

The voter selects a candidate and generates a random secret.
A hash:

Hash(CandidateID + Secret)

is signed via MetaMask and submitted through the Relayer.

Wait Period

The system enters a cooling period where no votes can be revealed, preventing early results from influencing voters.

Reveal Phase

After the commit deadline, the voter provides Candidate ID and Secret.
The contract verifies the original hash and increments the tally.

Tally

Once the reveal window closes, the final count is permanently recorded and displayed.

🛡️ Security
Double Voting Protection: Each wallet address can commit only once.
Privacy: Secret salt prevents vote guessing/rainbow table attacks.
Relayer Security: Backend allowlist prevents unauthorized gas usage.
👤 Author

Arnav Chauhan
Full-Stack Developer & Blockchain Enthusiast