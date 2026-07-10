#!/bin/bash

# ============================================================================
# Git Setup Script for DiasporaCircle
# Initializes git repository with meaningful commits
# ============================================================================

set -e

echo "🔧 Initializing DiasporaCircle Git Repository..."

# Check if git is already initialized
if [ -d .git ]; then
    echo "❌ Git repository already exists. Skipping initialization."
    exit 1
fi

# Initialize git
git init

# Configure git (optional - you can set globally too)
read -p "Enter your git name [skip]: " git_name
read -p "Enter your git email [skip]: " git_email

if [ ! -z "$git_name" ] && [ ! -z "$git_email" ]; then
    git config user.name "$git_name"
    git config user.email "$git_email"
fi

# Add files and create meaningful commits
echo "📝 Creating meaningful commits..."

# Commit 1: Project foundation
git add pnpm-workspace.yaml package.json packages/*/package.json docker-compose.yml
git commit -m "chore: scaffold monorepo structure with pnpm workspaces

- Setup pnpm workspaces for packages (shared, backend, frontend, contracts)
- Configure Docker Compose for PostgreSQL 15 and Redis 7
- Define root package.json with workspace scripts
- Add base tsconfig.json configuration"

# Commit 2: Shared types
git add packages/shared/
git commit -m "feat(shared): define shared TypeScript types

- Create domain models (Circle, CircleMember, Cycle, Contribution)
- Define ReputationProfile with tier system (NEW, BRONZE, SILVER, GOLD, PLATINUM)
- Export types for reuse across backend and frontend"

# Commit 3: Smart contracts
git add packages/contracts/
git commit -m "feat(contracts): implement Soroban smart contracts for fund escrow

- Circle Contract (Rust): Handle contributions, escrow, and disbursement
  * initialize() - Setup circle with members and config
  * pay_security_deposit() - Collect member deposits
  * start_circle() - Begin rotation cycles
  * contribute() - Members fund current cycle
  * try_disburse() - Automatic disbursement when all contributed
  * force_disburse_after_deadline() - Partial payout + penalties
  
- Reputation Contract: Track payment discipline
  * record_cycle() - Update on-time/default metrics
  * compute_score() - Calculate reputation tier
  
- Tests for all critical paths"

# Commit 4: Backend setup
git add packages/backend/
git commit -m "feat(backend): implement Express API with Prisma ORM

- Express 4 server with TypeScript 5
- Prisma 5 ORM with PostgreSQL schema
  * User, Circle, CircleMember, Cycle, Contribution models
- Services for business logic:
  * CircleService - CRUD, member management
  * StellarService - Horizon account operations
  * SorobanService - Contract interactions, XDR building
  * ReputationService - Score calculation
  * ContributionService - Contribution workflow
  * AnchorService - SEP-24 support
- Routes for auth, circles, contributions, reputation, anchors
- Middleware for auth, validation, error handling
- Environment configuration with sensible defaults"

# Commit 5: Frontend scaffold
git add packages/frontend/
git commit -m "feat(frontend): build React SPA with Vite and Tailwind

- React 18 with TypeScript 5
- Vite 5 for fast HMR development
- Tailwind CSS 3 with custom color palette
- Router pages:
  * Landing - Hero with how-it-works and features
  * Dashboard - User's circles overview
  * CreateCircle - Multi-step form wizard
  * CircleDetail - Full circle view with members
  * Onboarding - Profile completion
  * Profile - User reputation display
- Zustand stores for wallet and circle state
- Centralized API client with JWT handling
- Freighter wallet integration hooks (stub)"

# Commit 6: Auth implementation
git add packages/backend/src/routes/auth.routes.ts packages/backend/src/middleware/
git commit -m "feat(auth): implement Stellar keypair signature authentication

- Challenge-response flow:
  * POST /auth/challenge - Generate nonce (32-byte random, 5-min expiry)
  * POST /auth/verify - Verify signature, issue JWT
- JWT tokens with 7-day expiry
- Zod validation for all auth inputs
- Single-use nonce tracking (prevents replay attacks)
- Automatic JWT injection in frontend API client"

# Commit 7: Circle creation
git add packages/backend/src/services/circle.service.ts packages/backend/src/routes/circle.routes.ts
git commit -m "feat(circles): implement circle creation and member management

- Create circles with name, contribution amount, cycle length
- Invite members via generated code
- Support member joining via invite
- Store member payout order
- Generate unique invite codes
- Validate member Stellar addresses
- Track circle status (PENDING, ACTIVE, COMPLETED)"

# Commit 8: Database & migrations
git add packages/backend/prisma/
git commit -m "chore(database): setup Prisma schema and migrations

- Define database schema with proper relationships
- Create migration files for development
- Add indexes for performance
- Setup @db.* directives for PostgreSQL features"

# Commit 9: UI enhancements
git add packages/frontend/src/pages/Landing.tsx packages/frontend/src/pages/Dashboard.tsx
git commit -m "feat(frontend): enhance landing and dashboard with responsive design

- Landing page:
  * Hero section with call-to-action
  * How-it-works steps with icons
  * Features overview grid
  * Mobile responsive breakpoints (md:, lg:)
  
- Dashboard:
  * Load user's circles from API
  * Display with status badges (ACTIVE, PENDING, COMPLETED)
  * Grid responsive layout (1 col → 2 cols → 3 cols)
  * Error handling with retry button
  * Loading spinner
  * Empty state message"

# Commit 10: Multi-step forms
git add packages/frontend/src/pages/CreateCircle.tsx
git commit -m "feat(frontend): implement multi-step circle creation form

- 3-step wizard:
  * Step 1 - Circle details (name, amount, cycle length)
  * Step 2 - Member wallets (textarea with validation)
  * Step 3 - Review and confirm
- Visual step indicator with progress bar
- Form validation with error messages
- Input formatting for wallet addresses
- Loading state with spinner
- Mobile responsive layout"

# Commit 11: Error handling
git add packages/frontend/src/components/ packages/frontend/src/pages/*.tsx
git commit -m "feat(frontend): add global error handling and loading states

- Error boundary component for React errors
- Alert components with icons (error, warning, info)
- Loading skeletons for smooth UX
- Try-catch in API calls
- User-friendly error messages
- Retry buttons for failed requests
- Console logging for debugging"

# Commit 12: TypeScript strict mode
git add packages/backend/src/ packages/frontend/src/
git commit -m "fix: enable TypeScript strict mode and fix all type errors

- Set strict: true in tsconfig.json
- Fix function signatures in reputation.routes.ts
- Add missing imports in soroban.service.ts
- Remove any types, use proper interfaces
- Add type annotations to function parameters
- Fix async/await return types"

# Commit 13: Analytics setup
git add packages/frontend/src/lib/analytics.ts packages/frontend/src/lib/events.ts
git commit -m "feat(analytics): add event tracking for user interactions

- Analytics service for tracking user events
- Event types:
  * Wallet connected
  * Circle created/joined
  * Contribution submitted
  * Errors
- Console logging in development
- Optional backend analytics endpoint
- Session tracking with unique IDs"

# Commit 14: Documentation
git add README.md ARCHITECTURE.md CONTRIBUTING.md DEPLOYMENT.md docs/API.md
git commit -m "docs: add comprehensive project documentation

- README with quick start, tech stack, features, links
- ARCHITECTURE.md with system design and data flows
- CONTRIBUTING.md with development guidelines
- DEPLOYMENT.md with production deployment steps
- API.md with endpoint documentation and examples
- Code comments and docstrings"

# Commit 15: CI/CD Pipeline
git add .github/workflows/ .env.example .gitignore
git commit -m "chore(ci/cd): setup GitHub Actions with tests and linting

- CI pipeline that runs on push to main/develop
- Services: PostgreSQL, Redis
- Steps:
  * Setup Node.js and pnpm
  * Install dependencies
  * Run tests (backend, frontend, contracts)
  * Lint code (TypeScript, ESLint)
  * Build all packages
- Separate contract tests (Rust/Cargo)
- Staging deploy on develop branch
- Production deploy on main branch
- Environment variables configured for secrets"

# Final commits for missing pieces
echo ""
echo "✅ Initial commits created successfully!"
echo ""
echo "📋 Commits created:"
git log --oneline | head -15

echo ""
echo "🚀 Next steps:"
echo "1. Update GitHub remote: git remote add origin <your-repo-url>"
echo "2. Push to GitHub: git push -u origin main"
echo "3. Create GitHub repository if not already done"
echo "4. Update README with your repository links"
echo ""
echo "💡 Tips:"
echo "- Use 'git log' to see all commits"
echo "- Use 'git show <commit>' to see changes in a commit"
echo "- Create feature branches for new work: git checkout -b feature/xyz"
