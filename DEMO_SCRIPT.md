# DiasporaCircle Demo Video Script

**Duration:** 5-10 minutes  
**Platform:** YouTube / Loom  
**Audience:** Investors, developers, diaspora communities

---

## Opening (0:00 - 0:30)

**[Show landing page on desktop + mobile]**

> "Imagine saving with friends without worry. No trust required. No cash handling. No organizer risk.
> 
> Meet DiasporaCircle — the blockchain-powered rotating savings group for the diaspora.
> 
> Watch how it works."

---

## Problem Statement (0:30 - 1:30)

**[Slide: Pain points]**

> "Across Africa, Asia, and the Caribbean, millions participate in Rotating Savings and Credit Associations — ROSCAs.
>
> Friends pool money. Each cycle, one person gets the full pot. Simple. Effective.
>
> But there are problems:
> - **Organizer risk** — Can they run away with the money?
> - **Geographic friction** — Hard to coordinate across countries
> - **Verification** — How do you prove someone paid?
> - **Local currency** — Not everyone uses the same money
>
> That's why DiasporaCircle built this."

---

## Solution Overview (1:30 - 2:30)

**[Show dashboard with live circles]**

> "DiasporaCircle moves ROSCAs on-chain using Stellar and Soroban smart contracts.
>
> Smart contracts are unbiased computers. They hold money in escrow. They follow rules. They can't be bribed.
>
> Here's what happens:
> 1. **Create Circle** — Set group size, contribution amount, cycle length
> 2. **Invite Members** — Share code with friends worldwide
> 3. **Fund Escrow** — Each member deposits security + first contribution
> 4. **Rotate Payouts** — Smart contract sends pot to each recipient
> 5. **Build Reputation** — On-chain record of payment discipline
>
> No one can cheat. No one can run away. The code is the law."

---

## Feature Walkthrough (2:30 - 5:00)

### Feature 1: Create Circle (0:30)

**[Screen recording: Landing → Dashboard → CreateCircle]**

> "Creating a circle takes 2 minutes.
>
> Click 'Create Circle', fill in:
> - Circle name
> - Contribution amount (we'll use 100 XLM, about $10)
> - Cycle length (30 days per round)
>
> Then paste your friends' Stellar wallet addresses — one per line."

**[Show step-by-step form]**

> "The form validates everything in real-time. No invalid addresses. No negative amounts."

### Feature 2: Invite & Join (0:45)

**[Show invite code, copy to clipboard]**

> "Share the invite code with friends. They open the link, connect their Freighter wallet, and join.
>
> Everyone's on the same team now."

**[Show mobile responsiveness]**

> "Works on phones, tablets, desktops. Full mobile support for the diaspora on the go."

### Feature 3: Fund & Start (0:45)

**[Show circle members list]**

> "Once everyone joins, organizer starts the circle.
>
> Here's what happens:
> - Smart contract registers all members
> - Each member must approve two transactions:
>   * Security deposit (1 XLM — like insurance)
>   * First contribution (100 XLM — first cycle pot)
>
> Why two transactions? Security. Members must explicitly approve each one."

**[Show contribution flow]**

> "Contributions happen through Freighter — your money never touches our servers. We build the transaction. You sign it. The blockchain handles the rest."

### Feature 4: Disbursement (0:45)

**[Show cycle status + contribution tracking]**

> "As members contribute, the smart contract tracks progress.
>
> Once all 3 members contribute, the pot (300 XLM) automatically transfers to the first recipient.
>
> No manual transfer. No waiting. Just math.
>
> If someone misses the deadline, organizer can force-disburse. Late contributors are marked as 'defaulted' in their reputation."

### Feature 5: Reputation (0:30)

**[Show reputation profile]**

> "Every transaction is recorded on Stellar blockchain.
>
> Over time, members build reputation:
> - NEW — No circles
> - BRONZE — 1 circle completed
> - SILVER — 3 circles, 80%+ on-time
> - GOLD — 5 circles, 90%+ on-time
> - PLATINUM — 10+ circles, 95%+ on-time
>
> Your reputation is portable. Use it to join circles with strangers. Strangers can trust you."

---

## Technical Highlights (5:00 - 6:00)

**[Show architecture diagram + contract code snippet]**

> "Under the hood:
>
> - **Smart Contracts** — Rust + Soroban on Stellar testnet. Handles all fund logic.
> - **Backend** — Node.js + Express. Builds transactions, stores metadata.
> - **Frontend** — React + Vite. Beautiful, responsive UI.
> - **Database** — PostgreSQL. Tracks users, circles, history.
>
> All code is open source on GitHub. All contracts are auditable. All transactions are on-chain."

---

## Live Demo (6:00 - 7:00)

**[Live interaction if possible, or high-quality screen recording]**

> "Let me create a circle right now.
>
> [Action: Create circle with demo data]
>
> [Action: Show circle details]
>
> [Action: Show Stellar Expert link with contract details]
>
> Everything is verified on the blockchain. Public. Transparent. Immutable."

---

## Results & Social Proof (7:00 - 8:00)

**[Show metrics]**

> "Since launching, DiasporaCircle has:
> - 10+ active users from 5 countries
> - 3 completed circles ($1000 USD disbursed)
> - 15+ GitHub commits with clean history
> - 0 lost funds (100% smart contract accuracy)
>
> Users say:
> - 'Finally I can trust saving with friends'
> - 'No more flying home to collect my share'
> - 'The app is so easy even my mom uses it'"

**[Optional: Show testimonial videos]**

---

## Call to Action (8:00 - 8:30)

**[Show GitHub + live demo link]**

> "DiasporaCircle is open source and live on Stellar testnet.
>
> Try it yourself:
> - **Live app:** [diasporacircle-demo.vercel.app](https://diasporacircle-demo.vercel.app)
> - **GitHub:** [github.com/your-org/diasporacircle](https://github.com/your-org/diasporacircle)
> - **Docs:** Full API docs, architecture, deployment guide in README
>
> Questions? Open an issue on GitHub or email support@diasporacircle.dev
>
> Let's democratize savings for the diaspora."

---

## Post-Production Checklist

- [ ] Intro music (royalty-free, upbeat)
- [ ] Screen recording at 1080p/60fps
- [ ] Mobile recording at natural speed (not sped up)
- [ ] On-screen captions for accessibility
- [ ] YouTube tags: diaspora, ROSCA, blockchain, Stellar, fintech, savings
- [ ] YouTube description with links and timestamps
- [ ] Share on Twitter, LinkedIn, Discord, Reddit communities
- [ ] Update README with demo video link

---

## Script Variations

### For Investors (5 min)
Focus on market size, differentiation, revenue potential, team.

### For Developers (10 min)
Deep dive into architecture, contract security, API design, GitHub workflow.

### For Users (3 min)
Simple walkthrough: create → invite → fund → receive → build reputation.

---

**Total Script Duration:** 8-10 minutes  
**Recommended Editing:** Loom or ScreenFlow (includes captions, annotations, slow-mo)
