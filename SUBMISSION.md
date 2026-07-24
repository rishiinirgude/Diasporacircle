# DiasporaCircle — Level 4 Submission

## 🔗 Required Links

| Item | Link |
|------|------|
| **Public GitHub Repository** | https://github.com/rishiinirgude/Diasporacircle |
| **Live Demo** | https://frontend-coral-nine-24.vercel.app |
| **Backend API** | https://backend-nine-eta-58.vercel.app |
| **Backend Health** | https://backend-nine-eta-58.vercel.app/health |
| **Demo Video** | _(recording in progress)_ |
| **Circle Contract** | `CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7` |
| **Reputation Contract** | `CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y` |
| **Stellar Expert (Circle)** | https://stellar.expert/explorer/testnet/contract/CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7 |
| **Stellar Expert (Reputation)** | https://stellar.expert/explorer/testnet/contract/CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y |
| **User Proof** | [USER_PROOF.md](./USER_PROOF.md) |

---

## ✅ Submission Checklist

### 1. Public GitHub Repository
- ✅ https://github.com/rishiinirgude/Diasporacircle

### 2. README with Complete Documentation
- ✅ [README.md](./README.md) — Full overview, quick start, architecture, tech stack
- ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, contract functions, data flows
- ✅ [DEPLOYMENT.md](./DEPLOYMENT.md) — Production deployment guide
- ✅ [docs/API.md](./docs/API.md) — All API endpoints documented
- ✅ [CONTRIBUTING.md](./CONTRIBUTING.md) — Development guidelines
- ✅ [USER_PROOF.md](./USER_PROOF.md) — Real user wallet interactions with tx hashes

### 3. Minimum 15+ Meaningful Commits
- ✅ **53+ commits** — see `git log --oneline`

Key commits:
```
feat: deploy contracts to testnet, upgrade soroban-sdk v26
feat: real Stellar testnet transactions - Freighter signing, Neon DB
fix: all backend issues - start circle, security deposits, TS errors
fix: parse XDR string to Transaction object before Horizon submit
fix: add missing api import in Join.tsx
fix: auto-clear stale demo tokens, redirect to reconnect on 401
docs: add USER_PROOF.md with real wallet interactions
feat(join): add shareable invite link page
feat(feedback): in-app feedback page with star rating
feat(auth): implement Freighter wallet challenge-response auth
feat(backend): Express API with Prisma ORM and Stellar integration
feat(contracts): Soroban smart contracts for fund escrow and reputation
feat(frontend): build React SPA with Vite, Tailwind, Freighter
chore: scaffold monorepo structure with pnpm workspaces
```

### 4. Live Demo
- ✅ **https://frontend-coral-nine-24.vercel.app**

### 5. Contract Deployment Addresses (Stellar Testnet)

| Contract | Address |
|----------|---------|
| Circle Contract | `CBQ5AFJXUHHPTYZ2CREDNTS4E5NMJJHUKQBKITGY4FURHB4KCBGT3KR7` |
| Reputation Contract | `CDRBHNJZVNBKW2VO3FUAH6A6UBWMBTMURNS5LHUOL5GUJNCC2I5M5A7Y` |

Both contracts built with Soroban SDK v26 and deployed to Stellar Testnet.

### 6. Screenshots

#### Product UI
Live at https://frontend-coral-nine-24.vercel.app

Pages:
- `/` — Landing page with hero, how-it-works, features
- `/onboarding` — Wallet connect (Freighter + manual) + profile setup
- `/dashboard` — Circles grid with status badges
- `/circles/create` — 3-step circle creation wizard
- `/circles/:id` — Circle detail with contribute flow + invite link
- `/profile` — Reputation score and wallet info
- `/feedback` — User feedback collection form
- `/join` — Invite link join page

#### Mobile Responsive Design
All pages use Tailwind CSS responsive breakpoints (`sm:`, `md:`, `lg:`).
Fully functional at 320px+ viewport width.

#### Analytics / Monitoring
- Frontend: global JS error capture + page view tracking in `main.tsx`
- Backend: `GET /api/analytics/summary` — returns event counts
- Backend: `POST /api/analytics/track` — records any event
- Events: `page_view`, `wallet_connected`, `contribution_submitted`, `circle_started`, `js_error`

---

## 👥 Proof of User Wallet Interactions

See [USER_PROOF.md](./USER_PROOF.md) for full details.

| # | Name | Wallet | Tx Hash | Status |
|---|------|--------|---------|--------|
| 1 | Rishi Nirgude | `GDTFEGG6...ZYA5B` | `4db83e8e...084fcc` | ✅ Confirmed |
| 2 | Sneha Bhambare | `GDG4K3RX...SPFM` | `6c59e9a0...839bde` | ✅ Confirmed |
| 3 | Sarthak Jamadar | `GB6IZWMM...J6UQ` | `8939d141...4cff5` | ✅ Confirmed |
| 4 | Swanand Zanpure | `GD5PNDAW...NMKR` | `631e333a...21ce6` | ✅ Confirmed |

All transactions verifiable at https://stellar.expert/explorer/testnet

---

## 💬 User Feedback Summary

Collected via in-app form at `/feedback`.

| # | Name | Rating | Comment |
|---|------|--------|---------|
| 1 | Rishi Nirgude | ⭐⭐⭐⭐⭐ | "Works great on testnet, wallet connection was smooth" |
| 2 | Sneha Bhambare | ⭐⭐⭐⭐ | "Easy to join a circle and contribute" |
| 3 | Sarthak Jamadar | ⭐⭐⭐⭐ | "Good concept, contribution flow worked well" |
| 4 | Swanand Zanpure | ⭐⭐⭐⭐⭐ | "Liked the invite link feature, joined easily" |

**Average: 4.25 / 5**

---

## 🏗️ Technical Architecture

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS + Zustand
- **Backend:** Node.js 20 + Express 4 + Prisma ORM + PostgreSQL (Neon)
- **Smart Contracts:** Rust + Soroban SDK 26 (Circle + Reputation)
- **Auth:** Stellar keypair challenge-response → JWT
- **Wallet:** Freighter browser extension (real signing + manual fallback)
- **Database:** Neon PostgreSQL (production)
- **Deployment:** Vercel (frontend + backend serverless)
- **Network:** Stellar Testnet

---

**Submitted by:** Rishi Nirgude  
**GitHub:** https://github.com/rishiinirgude/Diasporacircle  
**Live Demo:** https://frontend-coral-nine-24.vercel.app  
**Date:** July 2026  
**Network:** Stellar Testnet
