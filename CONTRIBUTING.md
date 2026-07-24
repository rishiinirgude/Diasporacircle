cc# Contributing Guidelines

Thank you for your interest in contributing to DiasporaCircle! We welcome contributions of all types.

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

---

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/your-fork/diasporacircle
cd diasporacircle
```

### 2. Set Up Dev Environment

```bash
pnpm install
docker compose up -d
pnpm --filter backend run db:migrate
```

### 3. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### Making Changes

1. **Backend changes** → `packages/backend/src/**`
2. **Frontend changes** → `packages/frontend/src/**`
3. **Contract changes** → `packages/contracts/**`

### Code Style

**TypeScript**
- Use `strict: true` in tsconfig
- No `any` types (use `// TODO: type this` if necessary)
- Use Zod for validation

**React**
- Functional components only
- Custom hooks for logic
- Props interfaces (no inline types)

**Rust**
- Follow `cargo fmt` and `cargo clippy`
- Add tests for all public functions
- Document with doc comments

### Testing

Before submitting a PR, ensure tests pass:

```bash
# Backend tests
pnpm --filter backend run test

# Frontend tests
pnpm --filter frontend run test

# Contract tests
cd packages/contracts/circle && cargo test
```

### Linting

```bash
pnpm lint
```

---

## Commit Guidelines

### Message Format

```
type(scope): subject

body (optional)
footer (optional)
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Code style (prettier, etc.)
- `refactor` — Code refactoring
- `test` — Test additions
- `chore` — Build, deps, etc.

**Examples:**
```
feat(circle): add security deposit validation
fix(frontend): correct mobile layout on dashboard
docs: update API documentation
```

### Meaningful Commits

- One logical change per commit
- Write clear, descriptive messages
- Reference issues: `Fixes #123`

---

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `pnpm test`
2. Run linter: `pnpm lint`
3. Build locally: `pnpm build`
4. Rebase on latest `main`: `git rebase origin/main`

### PR Description

Include:
- What changes you made
- Why you made them
- Any relevant issues (Fixes #123)
- Screenshots (for UI changes)
- Test coverage

### Review Process

1. At least one maintainer review required
2. Address feedback
3. Rebase if needed
4. Merge to main

---

## Feature Development

### Adding a New API Endpoint

1. **Define types** in `packages/shared/src/types/`
2. **Implement service** in `packages/backend/src/services/`
3. **Create route** in `packages/backend/src/routes/`
4. **Add Zod validation** for request body
5. **Write tests** for service
6. **Document** in API.md

### Adding a New Page

1. **Create component** in `packages/frontend/src/pages/`
2. **Add route** in `src/App.tsx`
3. **Create hooks** if needed in `src/hooks/`
4. **Add to Zustand store** if needed
5. **Test responsiveness** at 320px, 768px, 1024px

### Modifying Database Schema

1. **Update** `prisma/schema.prisma`
2. **Create migration**: `pnpm --filter backend run db:migrate`
3. **Update types** in shared package
4. **Test migration** locally

---

## Documentation

### README Updates

If changes affect user-facing behavior:
- Update `README.md` or relevant doc
- Include examples
- Keep it concise

### Code Comments

- Comment complex logic
- Link to relevant issues/docs
- Use JSDoc for functions

**Example:**
```typescript
/**
 * Verify wallet signature against nonce
 * @param walletAddress Stellar public key
 * @param signatureBase64 Signed nonce in base64
 * @param nonce Original nonce string
 * @returns true if signature is valid
 */
export function verifyWalletSignature(
  walletAddress: string,
  signatureBase64: string,
  nonce: string
): boolean {
  // ...
}
```

---

## Reporting Bugs

### Create an Issue

1. **Title:** Brief description of bug
2. **Steps to reproduce:** How to trigger it
3. **Expected behavior:** What should happen
4. **Actual behavior:** What happens instead
5. **Environment:** Node version, OS, browser
6. **Screenshots:** If UI-related

**Example:**
```
Title: Dashboard fails to load when offline

Steps:
1. Disconnect from internet
2. Click "Refresh" on dashboard
3. Wait 10 seconds

Expected: Offline message or cached data
Actual: Blank screen, no error message

Environment: 
- Node 20.5
- macOS 13.5
- Chrome 125
```

---

## Feature Requests

### Create an Issue

1. **Title:** What you want to do
2. **Use case:** Why you need it
3. **Proposed solution:** How it should work
4. **Alternatives:** Other ways to solve it

**Example:**
```
Title: Recurring cycle settings

Use case: Users want circles to auto-repeat 
each month without re-creating

Proposed: Add "repeat" toggle in circle settings
- Auto-advance to next cycle
- Notify members before cycle starts

Alternatives:
- Manual re-create (current)
- API for automation
```

---

## Security Issues

**Do NOT open a public issue for security vulnerabilities.**

Instead, email: `security@diasporacircle.dev`

Include:
- Vulnerability description
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

---

## Questions & Support

- **GitHub Issues** — Bug reports, feature requests
- **Discussions** — Questions, ideas
- **Email** — security@diasporacircle.dev

---

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md) file
- GitHub contributor stats
- Release notes (for significant changes)

Thank you for contributing! 🙏
