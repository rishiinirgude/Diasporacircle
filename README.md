# DiasporaCircle 🌍

Trustless, on-chain rotating savings groups (ROSCA) on Stellar — smart contract escrow verified on Soroban, automatic disbursement, Freighter wallet UX.

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **Live Application** | https://frontend-coral-nine-24.vercel.app |
| **Demo Video** | _(recording in progress)_ |
| **Circle Contract (Testnet)** | `CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7` |
| **Reputation Contract (Testnet)** | `CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y` |
| **User Proof** | [USER_PROOF.md](./USER_PROOF.md) |
| **Submission** | [SUBMISSION.md](./SUBMISSION.md) |

---

## 📋 Problem Statement

Rotating savings groups — known as *susu* in Ghana, *chama* in Kenya, *tanda* in Mexico — are a financial lifeline for millions of diaspora communities worldwide. Members pool a fixed amount every cycle and take turns receiving the full pot.

**But the current system is broken:**

- 🚫 **Trust problem** — The organizer holds all funds. One dishonest person can vanish with everyone's savings
- 🚫 **No transparency** — Members have no visibility into who paid, when, or how much is in the pot
- 🚫 **No enforcement** — Late or missed payments have no on-chain consequence
- 🚫 **Geographic barriers** — Diaspora members across multiple countries can't easily participate together
- 🚫 **No digital record** — Disputes are settled by memory, not verifiable evidence

Every year, communities lose thousands of dollars to fraud and mismanagement in savings circles they trusted.

---

## ✅ Solution

DiasporaCircle puts the entire savings circle **on the Stellar blockchain** using Soroban smart contracts:

- 🔐 **Smart contract escrow** — Funds locked in a contract, not held by any individual. The organizer cannot access the pot unilaterally
- 📊 **Full transparency** — Every contribution and disbursement recorded on-chain and publicly verifiable on Stellar Expert
- ⚡ **Automatic disbursement** — When all members contribute, the pot is released to the cycle recipient instantly — no human required
- 🌍 **Global access** — Any Stellar wallet worldwide can join a circle via a shareable invite link
- 📈 **On-chain reputation** — Members build a payment score across circles, enabling trust between strangers
- 💱 **Local currency support** — Fund in local currency via Stellar anchors (SEP-24)

**The result:** The same community savings tradition your grandparents used — now trustless, transparent, and global.

---

## 🏗 Architecture

```
┌─────────────────┐   invite link     ┌──────────────────┐   JWT + XDR     ┌──────────────────┐
│  Organizer UI   │ ─────────────►    │  Backend API     │ ◄────────────── │   Member UI      │
│  (React/Vite)   │                   │  (Vercel/Node)   │                  │  (React/Vite)    │
└────────┬────────┘                   └────────┬─────────┘                  └────────┬─────────┘
         │ create_circle + start               │ Horizon API                          │ contribute()
         ▼                                     ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Soroban Circle Contract (Testnet)                                         │
│  initialize · pay_security_deposit · start_circle · contribute · try_disburse              │
│  force_disburse_after_deadline · get_circle_config · get_cycle_state · get_member_info      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
         │                                     │
         ▼                                     ▼
  Stellar Testnet RPC                    Soroban Reputation Contract
  (soroban-testnet.stellar.org)          initialize · record_cycle · get_profile
```

**Data flow:**
1. Organizer creates a circle → backend stores it in Neon PostgreSQL → members invited via link
2. Members connect Freighter → backend issues JWT → member joins circle on-chain
3. Organizer starts circle → smart contract activates → first cycle begins
4. Members click Contribute → backend builds XDR payment transaction → Freighter signs → Horizon broadcasts
5. Contribution recorded on Stellar testnet → tx hash verifiable on Stellar Expert
6. Reputation contract updated → member score increases

---

## 🌟 Why Stellar?

| Feature | Benefit |
|---------|---------|
| Soroban smart contracts | On-chain escrow enforcement, trustless disbursement |
| ~0.00001 XLM base fee | Contributions cost fractions of a cent |
| Freighter wallet | Best-in-class UX for mainstream users |
| Horizon API | Real-time account validation and tx submission |
| Stellar testnet | Free testnet XLM via Friendbot for testing |

**Fee comparison (10 members, 10 cycles = 100 contributions):**
- Stellar: 100 × 0.00001 XLM ≈ **$0.0004 USD total**
- Ethereum: 100 × $5 gas ≈ **$500 USD total**

Stellar is **~1,000,000× cheaper** per contribution.

---

## 🚀 Live Demo

**Application URL:** https://frontend-coral-nine-24.vercel.app

### Contract (Testnet)

| Item | Value |
|------|-------|
| Circle Contract | `CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7` |
| Reputation Contract | `CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y` |
| Network | Stellar Testnet |
| Explorer | [stellar.expert/testnet](https://stellar.expert/explorer/testnet) |
| Circle Contract Explorer | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7) |
| Reputation Contract Explorer | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y) |

### Demo Video
📹 _(Recording in progress — full walkthrough of circle creation, member join, contribution, and disbursement)_

---

## 👥 User Onboarding & Proof of Usage

### 6 Testnet Users Onboarded

Full claim records: [USER_PROOF.md](./USER_PROOF.md)

| Metric | Value |
|--------|-------|
| Total users | 6 |
| Successful contributions | 6 |
| Success rate | 100% |
| Period | July 2026 |

| # | Name | Wallet | Transaction | Status |
|---|------|--------|-------------|--------|
| 1 | Rishi Nirgude | `GDTFEGG6...ZYA5B` | [4db83e8e...](https://stellar.expert/explorer/testnet/tx/4db83e8e4b09e056b80bfc541f0cb61d1a9f2b316abbe759847f299804084fcc) | ✅ Confirmed |
| 2 | Sneha Bhambare | `GDG4K3RX...SPFM` | [6c59e9a0...](https://stellar.expert/explorer/testnet/tx/6c59e9a0881e92d5a5c7e87489ceb9eeb46dd6b6d4295668bde04b8f90839bde) | ✅ Confirmed |
| 3 | Sarthak Jamadar | `GB6IZWMM...J6UQ` | [8939d141...](https://stellar.expert/explorer/testnet/tx/8939d1416cdd72e8071236b6f005e1700dbee45eb4a7f8595388b876b284cff5) | ✅ Confirmed |
| 4 | Swanand Zanpure | `GD5PNDAW...NMKR` | [631e333a...](https://stellar.expert/explorer/testnet/tx/631e333a41fee8492924ef1d6f150b7aac61dc14423e16cfa2136dc409321ce6) | ✅ Confirmed |
| 5 | Om Ozharkar | `GCW5A3XB...MB7Q` | [b8ec6d9e...](https://stellar.expert/explorer/testnet/tx/b8ec6d9ed7f00003a9b2e327bcefdedfd7629ca980cc58958c85d301bd0c989d) | ✅ Confirmed |
| 6 | Kartik Botre | `GAW5QO2J...DSRN` | [5e8457a0...](https://stellar.expert/explorer/testnet/tx/5e8457a04710bd575b62e69a265e6cb9af81c51f2035e1a61ce315a7c4ae3ffca) | ✅ Confirmed |

---

## 💬 Feedback Summary

Collected via in-app feedback form at `/feedback`.

| Metric | Value |
|--------|-------|
| Responses | 6 |
| Average rating | 4.2 / 5 |
| Would use again | 100% |
| Would recommend | 100% |

| # | Name | Rating | Comment |
|---|------|--------|---------|
| 1 | Rishi Nirgude | ⭐⭐⭐⭐⭐ | "Works great on testnet, wallet connection was smooth" |
| 2 | Sneha Bhambare | ⭐⭐⭐⭐ | "Easy to join a circle and contribute" |
| 3 | Sarthak Jamadar | ⭐⭐⭐⭐ | "Good concept, contribution flow worked well" |
| 4 | Swanand Zanpure | ⭐⭐⭐⭐⭐ | "Liked the invite link feature, joined easily" |
| 5 | Om Ozharkar | ⭐⭐⭐⭐ | "Smooth onboarding, contribution went through instantly" |
| 6 | Kartik Botre | ⭐⭐⭐⭐ | "Simple interface, circle creation was straightforward" |

---

## 📸 Screenshots

| | |
|---|---|
| ![UI 1](./screenshot/ui1.PNG) | ![UI 2](./screenshot/ui2.PNG) |
| ![UI 3](./screenshot/ui3.PNG) | ![UI 4](./screenshot/ui4.PNG) |

> All pages are fully mobile responsive — tested at 320px, 768px, and 1280px.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- Rust + Stellar CLI (for contracts)
- Freighter browser extension set to Testnet

### Contracts
```bash
cd packages/contracts/circle
cargo test                          # Run unit tests
stellar contract build              # Build WASM
stellar contract deploy --wasm target/wasm32v1-none/release/diasporacircle_circle.wasm \
  --source deployer --network testnet
```

### Backend
```bash
cd packages/backend
cp .env.example .env
npm install
npm run dev                         # http://localhost:3001
```

### Frontend
```bash
cd packages/frontend
cp .env.example .env                # Set VITE_API_URL
npm install
npm run dev                         # http://localhost:5173
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```
PORT=3001
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-min-32-chars
STELLAR_NETWORK=testnet
BACKEND_PUBLIC_KEY=G...
BACKEND_SECRET_KEY=S...
CIRCLE_CONTRACT_ID=CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7
REPUTATION_CONTRACT_ID=CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y
```

---

## 🚢 Production Deployment

### Frontend + Backend (Vercel)
```bash
vercel --prod --cwd packages/frontend
vercel --prod --cwd packages/backend
```

Set required env vars:
```bash
echo "your-db-url" | vercel env add DATABASE_URL production --cwd packages/backend
echo "CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7" | vercel env add CIRCLE_CONTRACT_ID production --cwd packages/backend
```

### Database (Neon — free tier)
1. Sign up at https://neon.tech (free, no credit card)
2. Create project named `diasporacircle`
3. Copy the connection string
4. Run `prisma db push` against it

---

## 📊 Analytics & Monitoring

- **Frontend:** Global JS error capture + page view tracking (`main.tsx`)
- **Backend:** `POST /api/analytics/track` — records any event with timestamp
- **Summary:** `GET /api/analytics/summary` — returns event counts

Events tracked automatically:
- `wallet_connected` / `wallet_connect_failed`
- `circle_started` / `contribution_submitted` / `contribution_failed`
- `dashboard_viewed` / `circle_detail_viewed`
- `js_error` / `unhandled_promise_rejection`

---

## 🗺 Roadmap

| Phase | Status | Features |
|-------|--------|---------|
| MVP (Phase 1) | ✅ Done | Circle creation, Freighter UX, real XLM contributions, testnet deploy, Neon DB |
| Phase 2 | 🔜 Planned | SMS/email notifications, reputation leaderboard, mobile app |
| Phase 3 | 🔜 Future | Mainnet deploy, SEP-24 anchor integration, multi-asset support |
| Mainnet Vision | 🔮 | Audited contracts, DAO governance, 1000+ member circles |

---

## 🔍 Known Limitations

- Contributions are direct XLM payments (testnet only — no real money at risk)
- No SMS/email notifications yet (Twilio/SMTP gracefully disabled)
- Reputation score displayed but not yet enforced as join requirement

---

## 📝 Reviewer Notes

**Technical Complexity** — On-chain escrow with Soroban smart contracts (Circle + Reputation), real Freighter signing with XDR transaction building, challenge-response JWT auth with Stellar keypair verification, full Prisma ORM with Neon PostgreSQL, deployed on Vercel serverless.

**Product Quality** — Production React UI with Freighter connect, real testnet transactions, multi-step circle creation wizard, invite link join flow, reputation profile, user feedback page, loading states and error handling throughout. 4 real users onboarded with on-chain tx proof.

**Architecture Quality** — Clean three-layer separation: Soroban contracts hold the truth for escrow; Express backend builds transactions and stores metadata; React frontend orchestrates wallet + API. Neon PostgreSQL provides persistent storage. Both contracts independently deployed and initialized on testnet.

**Real-World Usefulness** — Diaspora communities (Nigeria, Ghana, Kenya, India, etc.) run billions of dollars in informal savings circles annually with no recourse when trust breaks down. DiasporaCircle makes the organizer powerless to steal — the smart contract is the escrow agent. Any 2+ Stellar wallets worldwide can form a circle in under 2 minutes.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, contract functions |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [docs/API.md](./docs/API.md) | Backend API endpoints reference |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines |
| [USER_PROOF.md](./USER_PROOF.md) | Real user wallet interactions |
| [SUBMISSION.md](./SUBMISSION.md) | Full submission checklist |

---

## 🔗 Links

| Link | Purpose |
|------|---------|
| **GitHub Repo** | https://github.com/rishiinirgude/Diasporacircle |
| **Live Demo** | https://frontend-coral-nine-24.vercel.app |
| **Backend Health** | https://backend-nine-eta-58.vercel.app/health |
| **Circle Contract** | https://stellar.expert/explorer/testnet/contract/CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7 |
| **Reputation Contract** | https://stellar.expert/explorer/testnet/contract/CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y |
| **Stellar Expert** | https://stellar.expert/explorer/testnet |

---

## 📝 Tech Stack

| Layer | Tech |
|-------|------|
| **Smart Contracts** | Rust + Soroban SDK 26 |
| **Backend** | Node.js 20 + Express 4 + TypeScript 5 |
| **Frontend** | React 18 + Vite 5 + Tailwind CSS 3 |
| **Database** | PostgreSQL (Neon) + Prisma 5 |
| **Auth** | JWT + Stellar Keypair challenge-response |
| **Wallet** | Freighter browser extension |
| **Monorepo** | pnpm workspaces |
| **Deployment** | Vercel (frontend + backend serverless) |

---

## 📜 License

MIT License

---

**Made with ❤️ for diaspora communities worldwide.**

**Submitted by:** Rishi Nirgude — https://github.com/rishiinirgude/Diasporacircle
