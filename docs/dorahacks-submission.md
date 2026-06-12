# DoraHacks Submission — ALPHASIGHT AI

## Project Name
ALPHASIGHT AI

## One-Line Pitch
The first autonomous on-chain threat intelligence system that watches smart money exit, predicts MEV exploitation, and alerts you before the damage happens — built for Mantle Network.

## Track
AI Alpha & Data (Mirana Ventures)

---

## Problem

DeFi users on Mantle are flying blind.

When smart money exits a pool, retail LPs lose 15-40% to MEV bots that exploit the thinning liquidity. The exit happens. The bots front-run the panic. Retail gets wrecked. All within hours.

**Nobody warns them in advance. Until now.**

Three problems that ALPHASIGHT AI solves:

1. **Smart money moves in silence** — influential wallets quietly exit LP positions before drawdowns, but retail has no way to detect this in real-time
2. **MEV follows exit sequences** — sandwich attacks spike predictably 4-8 hours after smart money exits, but nobody correlates these events
3. **AI predictions aren't verifiable** — any system can claim accuracy, but without on-chain records, nobody can verify it

---

## Solution

ALPHASIGHT AI is a three-layer autonomous intelligence system:

### Layer 1: Smart Money Surveillance
- Polls Mantle Network every 30 seconds
- Tracks LP removals, unstaking events, bridge-out transactions
- AI classifies each wallet: Smart Money, MEV Bot, Yield Farmer, Scammer, Accumulator, Distributor
- Generates exit conviction scores (0-100%)

### Layer 2: MEV Correlation Engine
- Monitors all DEX activity on Merchant Moe, Agni Finance, Fusion X
- Detects sandwich attacks, frontrunning, and arbitrage sweeps
- Correlates MEV spikes with smart money exit timing
- Generates pool risk scores in real-time

### Layer 3: Verifiable On-Chain Verdicts
- The Analyst agent writes every prediction to an Mantle smart contract
- Every verdict has a Mantle Explorer transaction hash
- Agent accuracy is tracked immutably — judges can verify every claim

---

## How It Works (Technical)

```
Watcher Agent          Hunter Agent           Analyst Agent
(30s polling)    →    (MEV scanning)    →    (Correlation + On-chain)
     |                      |                        |
Detects exit         Finds MEV spike         Stores verdict on Mantle
Signals Hunter       Signals Analyst         Generates alert
```

**AI Integration (Claude Sonnet 4.6):**
- Wallet behavior classification with structured JSON output
- Signal generation from multi-source on-chain events
- Natural language chat interface with live context injection
- MEV-exit correlation scoring

**Smart Contract (Solidity 0.8.20):**
```solidity
function storeVerdict(string signalType, uint8 confidence, string pool, address agentId) 
    returns (uint256 id)
// Returns on-chain ID — every prediction permanently verifiable
```

---

## What Makes This Different

| Feature | AlphaSight AI | Typical Whale Tracker |
|---------|--------------|----------------------|
| MEV correlation | ✅ Real-time | ❌ None |
| Exit sequence detection | ✅ Predictive | ❌ Reactive |
| On-chain verdicts | ✅ Permanent | ❌ None |
| AI explanations | ✅ Per event | ❌ None |
| Autonomous agents | ✅ 3 agents | ❌ None |
| Agent accuracy tracking | ✅ On-chain | ❌ None |
| Telegram alerts | ✅ Categorized | Varies |

---

## Traction / Demo

**Live at:** https://alphasight.ai

**What you can do right now:**
1. Open Dashboard → See 3 agents running with live status
2. Click Alpha Feed → See real AI-generated signals with confidence scores
3. Open Smart Money Radar → See whale wallets with exit conviction scores
4. Click MEV Radar → See sandwich attack volume by pool
5. Open Mantle Explorer → Find our contract, see stored verdicts
6. Ask Alpha → "Is Merchant Moe safe to LP in?" → Get structured AI response

**On-chain contract:** `[deployed address here]`
**Transaction count:** `[live count here]`

---

## Impact on Mantle Ecosystem

1. **Retail protection** — users know when to exit before MEV bots profit
2. **Pool health monitoring** — protocol teams can see which pools are under attack
3. **Institutional credibility** — every AI prediction is verifiable, not just a claim
4. **New primitive** — verifiable autonomous AI agents with on-chain accountability

---

## Roadmap Beyond Hackathon

- **Week 1:** Deploy to Mantle mainnet, grow subscriber base via Telegram
- **Month 1:** Add more Mantle protocols (Cashmere, INIT Capital, Leonicorn)
- **Month 3:** Open API for other protocols to query AlphaSight intelligence
- **Month 6:** Governance token for community-verified verdicts

---

## Team

- AI Engineer — Agent orchestration, Claude integration
- Blockchain Engineer — Smart contract, Mantle RPC integration
- Backend Engineer — NestJS, data pipeline, WebSocket
- Frontend Engineer — Next.js dashboard, real-time UI

---

## Technical Specs

- **Smart Contract:** AlphaSightIntelligence.sol on Mantle (Chain ID 5000)
- **Backend:** NestJS + TypeScript + PostgreSQL + Redis
- **Frontend:** Next.js 14 + Tailwind CSS (dark terminal aesthetic)
- **AI:** Claude Sonnet 4.6 via Anthropic SDK
- **Blockchain:** ethers.js v6, Mantle RPC
- **Real-time:** Socket.io WebSocket gateway

---

## GitHub
[Link to repo]

## Demo Video
[2-minute walkthrough video]

## Live Demo
[https://alphasight.ai]
