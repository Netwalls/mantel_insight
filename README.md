# AlphaSight AI
### On-chain intelligence platform for Mantle Network

Watch what influential wallets are doing. Know before everyone else does.

**Hackathon Track:** AI Alpha & Data (Mirana Ventures)  
**Contract Network:** Mantle Sepolia Testnet (chain 5003)  
**Surveillance Network:** Mantle Mainnet (chain 5000, read-only)  
**Deployed Contract:** [`0x9C6cBEaBF1931Bc677db34aDDa02df1E9dC132bf`](https://explorer.sepolia.mantle.xyz/address/0x9C6cBEaBF1931Bc677db34aDDa02df1E9dC132bf)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  USER (Browser + Telegram)                                           │
│  MetaMask wallet login  →  Mantle Sepolia (chain 5003)               │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTPS + WebSocket
┌──────────────────────▼───────────────────────────────────────────────┐
│  FRONTEND  (Next.js 14 · App Router · Tailwind)                      │
│  /dashboard  /feed  /wallets  /mev  /chat  /contract                 │
│                                                                      │
│  WalletContext  →  MetaMask  →  addChain(Mantle Sepolia)             │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ REST + WebSocket (port 3001)
┌──────────────────────▼───────────────────────────────────────────────┐
│  BACKEND  (NestJS · TypeScript · TypeORM · Redis)                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  AGENT PIPELINE                                             │     │
│  │                                                             │     │
│  │  WatcherAgent ──→ HunterAgent ──→ AnalystAgent             │     │
│  │  (polls blocks)   (scans MEV)    (scores + on-chain write)  │     │
│  │                                                             │     │
│  │  Communication: Redis event queue (EventEmitter2)           │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Modules:  Wallets · MEV · Signals · AI · Contracts · Telegram       │
│                                                                      │
│  AI: Claude Sonnet 4.6 → wallet classification, signal generation    │
│  Telegram: Telegraf bot → real-time whale/MEV alerts                 │
└────────┬─────────────────────────────────────────┬───────────────────┘
         │                                         │
         │ eth_getLogs / eth_getBlockByNumber       │ Contract calls
         │ READ-ONLY, no gas cost                  │ storeVerdict()
         ▼                                         ▼
┌─────────────────────────┐           ┌────────────────────────────────┐
│  Mantle MAINNET         │           │  Mantle SEPOLIA Testnet        │
│  Chain ID: 5000         │           │  Chain ID: 5003                │
│  rpc.mantle.xyz         │           │  rpc.sepolia.mantle.xyz        │
│                         │           │                                │
│  Wallet surveillance:   │           │  AlphaSightIntelligence.sol    │
│  7 real EOA addresses   │           │  0x9C6cBEaBF193...132bf        │
│  tracked in real-time   │           │                                │
│  LP removes, transfers, │           │  Stores every AI verdict       │
│  DEX swaps, staking     │           │  permanently on-chain          │
└─────────────────────────┘           └────────────────────────────────┘
```

### Why dual RPC?

Wallet surveillance reads Mantle mainnet — the real ecosystem with real money moving. No gas cost, just RPC reads.

Contract writes go to Sepolia testnet — free gas for the hackathon. Every AI verdict gets stored on-chain with a verifiable transaction hash. In production this would flip to mainnet.

---

## Data Flow

```
Mantle Mainnet blocks
        │
        ▼
WalletPollingService (every 30s)
  └── eth_getLogs on 7 watched mainnet wallets
  └── classifyLogEvent() → EventType (BUY/SELL/LP_ADD/LP_REMOVE/TRANSFER)
  └── recordEvent() → PostgreSQL
  └── aiService.classifyWallet() → Claude Sonnet 4.6
        └── returns { score, tag, exit_conviction, explanation }
        └── updateWalletScore() → broadcast via WebSocket

MevDetectorService (every 20s)
  └── getGasPrice() from mainnet
  └── rolling 100-sample baseline
  └── if current > 2x baseline → handleGasSpike()
        └── determines attack type by spike severity:
              > 5x → SANDWICH (CRITICAL)
              > 3x → FRONTRUN (HIGH)
              else → ARBITRAGE (MEDIUM)
        └── recordMevEvent() → PostgreSQL
        └── eventEmitter.emit('mev.gas.spike')

AgentService (every 60s)
  └── WatcherAgent reads wallet events
  └── HunterAgent reads MEV events
  └── AnalystAgent correlates both → generates signal
        └── contractsService.storeVerdict() → Mantle Sepolia tx
        └── signalsService.create() → PostgreSQL + WebSocket broadcast
        └── telegramService.sendAlert() → subscribed users
```

---

## Smart Contract

**AlphaSightIntelligence.sol** — Deployed on Mantle Sepolia

Explorer: https://explorer.sepolia.mantle.xyz/address/0x9C6cBEaBF1931Bc677db34aDDa02df1E9dC132bf

```solidity
// Store an AI verdict on-chain
function storeVerdict(
    string memory _signalType,  // "Exit Warning" | "MEV Risk" | "Accumulation" | ...
    uint8 _confidence,           // 0-100
    string memory _pool,         // "ETH/USDC" | "ETH/MNT" | ...
    address _agentId             // which agent filed this verdict
) external returns (uint256 verdictId);

// Read all verdicts for an agent
function getVerdictsByAgent(address _agentId)
    external view returns (Verdict[] memory);

// Get agent accuracy (verdicts resolved correct / total resolved)
function getAgentAccuracy(address _agentId)
    external view returns (uint256);  // 0-100

// Resolve a verdict as correct or incorrect
function resolveVerdict(uint256 _id, bool _wasCorrect) external;
```

Each verdict emits a `VerdictStored` event with verdict ID and block timestamp — every AI prediction has a permanent, auditable trail.

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)
- Anthropic API key — get at https://console.anthropic.com
- Telegram bot token — create via @BotFather → `/newbot` (optional)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/alphasight-ai
cd alphasight-ai
```

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://alphasight:alphasight@localhost:5432/alphasight
REDIS_URL=redis://localhost:6379

# Mantle — two separate RPCs
MANTLE_RPC_URL=https://rpc.mantle.xyz                   # mainnet, surveillance (read-only)
MANTLE_CHAIN_ID=5000
MANTLE_CONTRACT_RPC_URL=https://rpc.sepolia.mantle.xyz  # Sepolia, contract writes
MANTLE_CONTRACT_CHAIN_ID=5003

# Deployed contract
CONTRACT_ADDRESS=0x9C6cBEaBF1931Bc677db34aDDa02df1E9dC132bf
DEPLOYER_PRIVATE_KEY=your_private_key_here              # needs test MNT for gas

# AI + Alerts
ANTHROPIC_API_KEY=your_anthropic_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# App
PORT=3001
JWT_SECRET=change_this_in_production
```

### 2. Start infrastructure

```bash
docker-compose up -d postgres redis
```

### 3. Run backend

```bash
cd backend
npm install
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### 4. Run frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

### 5. Connect wallet

Open http://localhost:3000 and click "Connect Wallet". MetaMask will prompt to add Mantle Sepolia (chain 5003) automatically.

### 6. (Optional) Redeploy contract

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network mantleTestnet
# Copy the logged address to backend/.env CONTRACT_ADDRESS
```

Get test MNT at https://faucet.sepolia.mantle.xyz

---

## API Reference

```
GET  /api/wallets                   All tracked wallets
GET  /api/wallets/:address          Wallet detail + event history
GET  /api/wallets/exiting           High exit-conviction wallets

GET  /api/signals                   Alpha signals (newest first)
GET  /api/signals/high-risk         Critical + high risk only

GET  /api/mev                       Recent MEV events
GET  /api/mev/pool-risks            Risk score per pool
GET  /api/mev/stats                 24h MEV stats

GET  /api/agents/status             Agent status + last verdict
GET  /api/agents/verdicts           Recent on-chain verdicts

POST /api/ai/chat                   Ask Alpha — natural language chat
     body: { "message": "Is Merchant Moe safe to LP?" }

GET  /api/contracts/verdicts        On-chain verdicts from Mantle
GET  /api/blockchain/status         Mantle node status + block height
```

Full docs: http://localhost:3001/api/docs

---

## Telegram Bot

After setting `TELEGRAM_BOT_TOKEN`, find your bot on Telegram:

```
/start          welcome + menu
/status         current ecosystem status
/feed           latest 5 alpha signals
/subscribe      choose alert types: whale | mev | exit | accumulation
/unsubscribe    remove alert types
```

Alerts fire automatically when the AnalystAgent writes a new verdict.

---

## Features

**Watcher Wallets** — 7 real Mantle mainnet EOAs tracked live. Every LP remove, swap, and transfer is logged and scored by Claude. Each wallet gets a 0–100 influence score and an exit conviction %.

**MEV Detection** — Monitors Mantle gas prices on a 100-sample rolling baseline. A spike above 2x triggers an event record. Type and severity determined by spike magnitude.

**Alpha Feed** — AI-generated signals from the AnalystAgent, stored on-chain and broadcast via WebSocket. Each signal has a type, confidence score, and risk level.

**On-Chain Verdicts** — Every AI prediction is a transaction on Mantle Sepolia. Immutable. Verifiable. The AnalystAgent accumulates an accuracy record anyone can query.

**Ask Alpha** — Chat powered by Claude Sonnet 4.6 with live ecosystem context injected into every prompt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + App Router + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + TypeORM |
| Cache / Queue | Redis + EventEmitter2 |
| AI | Claude Sonnet 4.6 (Anthropic) |
| Blockchain reads | ethers.js v6 → Mantle Mainnet RPC |
| Contract writes | ethers.js v6 → Mantle Sepolia RPC |
| Smart Contract | Solidity 0.8.20 + Hardhat |
| Telegram | Telegraf |
| WebSocket | Socket.io |
| Auth | MetaMask (EIP-4361 wallet signature) |

---

## Demo Script (2 minutes)

```
00:00 — Dashboard: live block height, agent status, latest signals
00:20 — Watcher Wallets: one wallet mid-exit, AI explanation visible
00:40 — Alpha Feed: Exit Warning signal, confidence score, on-chain tx hash
01:00 — MEV: gas spike correlated with the exit sequence
01:20 — Contract page: open Mantle Explorer
         "Every prediction this system makes is stored here. Permanently."
01:40 — Ask Alpha: "Is Merchant Moe safe to LP right now?"
02:00 — Telegram: live alert fires to subscribed channel
```

---

## License

MIT — Built for the Mantle Hackathon 2025
