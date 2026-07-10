# Architecture & Technical Design

## System Overview

DiasporaCircle is a full-stack web3 application built on Stellar's Soroban smart contracts. The system follows a **distributed escrow model** where a smart contract holds all funds and disburses them automatically based on predefined logic.

```
┌──────────────────┐
│  React Frontend  │  User interactions, wallet signing
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────┐
│ Express Backend  │  API, auth, business logic
└────────┬─────────┘
         │ Prisma ORM
         ▼
┌──────────────────┐
│   PostgreSQL DB  │  User, circle, transaction data
└──────────────────┘

         │ Soroban RPC
         ▼
┌──────────────────────────┐
│ Stellar Testnet          │
│ • Circle Contract        │
│ • Reputation Contract    │
└──────────────────────────┘
```

---

## 1. Frontend Architecture

### Tech Stack
- **React 18** — UI components with hooks
- **Vite 5** — Build tool, dev server
- **TypeScript 5** — Type safety
- **Tailwind CSS 3** — Styling
- **Zustand** — State management
- **React Router 6** — Navigation

### Key Components

| Component | Purpose |
|-----------|---------|
| `Landing.tsx` | Hero page, how-it-works, features |
| `Dashboard.tsx` | User's circles overview, quick actions |
| `CreateCircle.tsx` | 3-step wizard to create circle |
| `CircleDetail.tsx` | Full circle view, member list, contribute |
| `Onboarding.tsx` | Post-login profile completion |
| `Profile.tsx` | User profile, reputation |

### State Management (Zustand)

```typescript
// Wallet Store
useWalletStore() {
  address: string | null
  token: string | null
  isConnected: boolean
  setAddress(), setToken(), disconnect()
}

// Circle Store  
useCircleStore() {
  circles: Circle[]
  setCircles(), addCircle()
}
```

### API Client

```typescript
// Centralized fetch with JWT auth
api.get<T>(path: string): Promise<T>
api.post<T>(path: string, body: any): Promise<T>
// Automatically includes Authorization header
```

### Analytics & Events

```typescript
// Event tracking for user interactions
EventTracker.trackWalletConnected()
EventTracker.trackCircleCreated()
EventTracker.trackContributionSubmitted()
// All events logged to console + optional backend
```

---

## 2. Backend Architecture

### Tech Stack
- **Node.js 20** — Runtime
- **Express 4** — Web framework
- **TypeScript 5** — Type safety
- **Prisma 5** — ORM
- **PostgreSQL 15** — Database
- **Redis 7** — Cache (future: job queue)
- **JWT** — Authentication

### Route Structure

```
/api/auth
  POST /challenge         → Get nonce for signing
  POST /verify           → Verify signature, issue JWT

/api/circles
  GET /                  → List user's circles
  POST /                 → Create new circle
  GET /:id               → Get circle details
  POST /:id/start        → Start circle (organizer)
  GET /join/:code        → Preview circle (no auth)
  POST /join/:code       → Join circle

/api/circles/:id/contribute
  POST /prepare          → Get unsigned XDR for contribution
  POST /submit           → Submit signed XDR

/api/reputation/:address
  GET /                  → Get reputation profile

/api/anchors
  GET /                  → List supported anchors
  POST /deposit-url      → Get SEP-24 deposit URL
```

### Service Layer

**CircleService**
```
createCircle(input) → Create circle + members
getCircleById(id) → Fetch circle with relations
getUserCircles(address) → Get user's circles
joinCircle(code, address) → Join via invite code
startCircle(id, organizer) → Start circle, create cycle 0
```

**StellarService**
```
getAccount(publicKey) → Load account from Horizon
submitTransaction(xdr) → Submit tx to testnet
pollForTransaction(hash) → Wait for confirmation
validatePublicKey(key) → Verify Stellar address
```

**SorobanService**
```
buildContributeTransaction() → Build unsigned XDR
submitSignedTransaction() → Submit signed tx
getCircleConfig() → Query contract state
```

**ReputationService**
```
getProfile(address) → Get reputation profile
computeScoreFromCycles() → Calculate score
```

### Database Schema

```prisma
model User {
  walletAddress String (unique)
  displayName, phone, email, country
  organizedCircles: Circle[]
  memberships: CircleMember[]
  contributions: Contribution[]
}

model Circle {
  name, organizerAddress, contractId
  contributionAmount, escrowAsset, cycleLengthDays
  status: PENDING | ACTIVE | COMPLETED | PAUSED
  members: CircleMember[]
  cycles: Cycle[]
}

model CircleMember {
  circleId, walletAddress, payoutPosition
  securityDepositPaid, securityDepositTxHash
  unique(circleId, walletAddress)
}

model Cycle {
  cycleIndex, recipientAddress, deadline
  status: OPEN | DISBURSED | DEFAULTED
  disbursedAt, disbursementTxHash
  contributions: Contribution[]
  unique(circleId, cycleIndex)
}

model Contribution {
  cycleId, memberAddress, amount, asset, txHash
  paidAt, isOnTime
}

model AuthChallenge {
  walletAddress, nonce, expiresAt, used
}
```

---

## 3. Smart Contract Architecture

### Circle Contract (`packages/contracts/circle/src/lib.rs`)

**Data Structures**
```rust
CircleConfig {
  organizer: Address
  contribution_amount: i128
  escrow_asset: Address
  cycle_length_days: u32
  total_members: u32
  current_cycle: u32
  payout_order: Vec<Address>
  status: Symbol (Pending | Active | Completed | Paused)
  reputation_contract: Address
}

CycleState {
  cycle_index: u32
  recipient: Address
  deadline_timestamp: u64
  contributions_received: u32
  total_escrowed: i128
  disbursed: bool
}

MemberInfo {
  address: Address
  joined_at: u64
  security_deposit_paid: bool
  cycles_paid_on_time: u32
  cycles_defaulted: u32
}
```

**Storage Keys**
```rust
DataKey::Circle              → CircleConfig
DataKey::Member(address)     → MemberInfo
DataKey::Cycle(u32)          → CycleState
DataKey::ContributionStatus(u32, address) → bool
```

**Key Functions**
```rust
initialize(organizer, config)
  → Store initial circle config

pay_security_deposit(member)
  → Transfer deposit tokens, mark member ready

start_circle(organizer)
  → Verify all deposits paid, set status to Active
  → Create cycle 0 with deadline

contribute(member, cycle_index)
  → Assert member hasn't already contributed
  → Transfer tokens into escrow
  → Auto-disburse if all members paid

try_disburse(cycle_index)
  → Transfer escrowed pot to recipient
  → Update reputation registry
  → Advance to next cycle or mark complete

force_disburse_after_deadline(organizer, cycle_index)
  → After deadline, disburse partial pot
  → Record defaults for missing members
  → Advance cycle
```

### Reputation Contract (`packages/contracts/reputation/src/lib.rs`)

**Data Structures**
```rust
ReputationProfile {
  wallet: Address
  circles_completed: u32
  total_on_time: u32
  total_late: u32
  total_defaulted: u32
  score: u32 (0-1000)
}
```

**Functions**
```rust
initialize(admin)
authorize_circle(admin, circle)
  → Add circle to authorized set

record_cycle(circle, member, paid_on_time)
  → Update member profile
  → Recalculate score:
    score = (on_time * 1000) / (on_time + late + defaulted)
    score *= min(circles_completed / 5, 1.0)
    score = capped at 1000

get_profile(member)
  → Return reputation profile
```

---

## 4. Authentication Flow

### Challenge-Response (Stellar Auth)

```
1. Frontend: POST /api/auth/challenge
   Body: { walletAddress: "G..." }
   Response: { nonce: "hex_string" }
   
2. Backend: Generate 32-byte nonce, store with 5-min expiry
   
3. Frontend: User signs nonce with Freighter wallet
   Signed: base64_encoded_signature
   
4. Frontend: POST /api/auth/verify
   Body: { walletAddress, signature, nonce }
   
5. Backend: 
   - Find nonce, verify not expired/used
   - Verify signature: keypair.verify(nonce, signature)
   - Mark nonce used
   - Issue JWT with { walletAddress } payload
   
6. Response: { token: "jwt..." }
   
7. Frontend: localStorage.setItem('dc_token', token)
   
8. Future requests: Include Authorization: Bearer token
```

### JWT Structure
```
Header: { alg: "HS256", typ: "JWT" }
Payload: {
  walletAddress: "G...",
  iat: 1234567890,
  exp: 1234654290 (7 days)
}
Signature: HMAC(secret)
```

---

## 5. Transaction Flow

### Create Circle

```
User submits form with members
  ↓
POST /api/circles
  ↓
CircleService.createCircle()
  - Validate all addresses
  - Upsert users
  - Create Circle record (status: PENDING)
  - Create CircleMember records with payout positions
  ↓
Return circle with inviteCode
  ↓
User shares invite code to members
```

### Join Circle

```
Member receives invite code
  ↓
GET /api/circles/join/:code (no auth)
  - Preview circle name, size, contribution
  ↓
User connects wallet
  ↓
POST /api/circles/join/:code (auth required)
  ↓
CircleService.joinCircle()
  - Find circle by code
  - Verify status is PENDING
  - Add member with next payout position
  ↓
Circle now has member
```

### Start Circle

```
All members on-chain, organizer clicks "Start"
  ↓
POST /api/circles/:id/start (organizer auth)
  ↓
CircleService.startCircle()
  - Verify organizer
  - Assert all members in contract
  - Update circle status to ACTIVE
  - Create Cycle 0 with deadline
  ↓
Schedule reminder jobs (BullMQ)
  ↓
Circle is live
```

### Contribute

```
Member decides to contribute
  ↓
GET /api/circles/:id/contribute/prepare (auth)
  ↓
SorobanService.buildContributeTransaction()
  - Load member account
  - Build XDR for contract call: contribute(member, cycle_index)
  - Simulate transaction
  - Return unsigned XDR
  ↓
Frontend receives XDR
  ↓
User signs XDR with Freighter
  ↓
Frontend submits signed XDR
  ↓
POST /api/circles/:id/contribute/submit
  ↓
SorobanService.submitSignedTransaction()
  - Submit to testnet
  - Poll for confirmation (up to 30 sec)
  - Create Contribution record
  ↓
Success: Pot disbursed if all members paid
  (or advance cycle if deadline reached)
```

---

## 6. Error Handling

### Frontend

```typescript
try {
  const data = await api.get('/circles')
} catch (err) {
  // Show toast: "Failed to load circles"
  // Log to analytics
  // Retry button
}
```

### Backend

```typescript
// Zod validation
const schema = z.object({ walletAddress: z.string() })
const data = schema.parse(req.body) // throws ZodError

// Error middleware catches and returns:
{ error: "Invalid request", details?: {...} }

// Async always wrapped in try-catch
router.post('/', async (req, res) => {
  try {
    // logic
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})
```

---

## 7. Security Considerations

### Private Key Protection
- **Never** store user private keys on backend
- Signing happens entirely in browser via Freighter wallet
- Backend never receives signed XDRs directly (only user broadcasts)

### Auth
- Nonces: 32-byte, random, single-use, 5-min expiry
- Signature verification: Keypair.verify()
- JWT: Expires in 7 days, rotatable

### Input Validation
- All POST body validated with Zod schemas
- Wallet addresses validated with StrKey.isValidEd25519PublicKey()
- Amounts checked for positive values

### Contract Safeguards
- Escrow stored in contract, not user accounts
- Disbursement logic in contract (not backend)
- Organizer cannot access funds unilaterally
- If organizer goes offline, members can force-disburse after deadline

---

## 8. Deployment Checklist

- [ ] Contracts compiled and deployed to testnet
- [ ] Contract IDs added to .env
- [ ] Backend deployed (Railway, Render, etc.)
- [ ] Frontend deployed (Vercel, Netlify)
- [ ] PostgreSQL database provisioned
- [ ] Redis provisioned (or use in-memory for MVP)
- [ ] DNS configured
- [ ] SSL certificates configured
- [ ] Environment variables locked down
- [ ] Monitoring/logging configured

---

## 9. Scaling Considerations

### Current Limitations
- Single database node
- No read replicas
- Redis single instance
- No sharding

### Future Optimizations
- Database replication
- Redis clustering
- GraphQL for complex queries
- Caching layer (CDN)
- Contract upgrades with proxy pattern
- Batch notifications via email/SMS queue

---

**Last Updated:** 2026-07-10
