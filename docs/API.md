# API Documentation

Complete reference for all DiasporaCircle backend endpoints.

## Base URL

- **Development:** `http://localhost:3001/api`
- **Production:** `https://diasporacircle.your-domain.com/api`

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Getting a Token

1. **Get Challenge**
   ```bash
   POST /auth/challenge
   Content-Type: application/json
   
   { "walletAddress": "GXXXXXX..." }
   ```
   Response:
   ```json
   { "nonce": "aabbccdd...", "ttl": 300 }
   ```

2. **Sign Challenge with Wallet**
   - Use Freighter or Stellar Wallets Kit
   - Sign the nonce string

3. **Verify Signature**
   ```bash
   POST /auth/verify
   Content-Type: application/json
   
   {
     "walletAddress": "GXXXXXX...",
     "signature": "base64_encoded_signature",
     "nonce": "aabbccdd..."
   }
   ```
   Response:
   ```json
   { "token": "eyJhbGci..." }
   ```

4. **Use Token for Future Requests**
   ```bash
   GET /circles
   Authorization: Bearer eyJhbGci...
   ```

---

## Endpoints

### Authentication

#### POST /auth/challenge

Get a nonce to sign for authentication.

**Request:**
```json
{
  "walletAddress": "GXXXXXX..."
}
```

**Response (200 OK):**
```json
{
  "nonce": "aabbccdd...",
  "ttl": 300
}
```

**Errors:**
- `400 Bad Request` — Invalid wallet address
- `500 Internal Server Error` — Database error

---

#### POST /auth/verify

Verify signed nonce and get JWT token.

**Request:**
```json
{
  "walletAddress": "GXXXXXX...",
  "signature": "base64_signature",
  "nonce": "aabbccdd..."
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800
}
```

**Errors:**
- `400 Bad Request` — Invalid signature or expired nonce
- `401 Unauthorized` — Signature verification failed
- `404 Not Found` — Nonce not found or already used

---

### Circles

#### GET /circles

List user's circles (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "circles": [
    {
      "id": "uuid",
      "name": "Friends Fund",
      "organizerAddress": "GXXXXXX...",
      "status": "ACTIVE",
      "contributionAmount": 100,
      "escrowAsset": "native",
      "cycleLengthDays": 30,
      "totalMembers": 3,
      "currentCycle": 1,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

#### POST /circles

Create a new circle (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Friends Fund",
  "contributionAmount": 100,
  "cycleLengthDays": 30,
  "escrowAsset": "native",
  "memberWallets": ["GAAAA...", "GBBBB..."],
  "payoutOrder": ["GAAAA...", "GBBBB..."]
}
```

**Validation:**
- `name` — Non-empty string
- `contributionAmount` — Positive number
- `cycleLengthDays` — Positive integer
- `memberWallets` — Array of valid Stellar addresses
- At least 2 members

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Friends Fund",
  "organizerAddress": "GXXXXXX...",
  "status": "PENDING",
  "contributionAmount": 100,
  "escrowAsset": "native",
  "cycleLengthDays": 30,
  "totalMembers": 2,
  "inviteCode": "ABC123DEF456",
  "contractId": null,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

**Errors:**
- `400 Bad Request` — Validation failed
- `401 Unauthorized` — Not authenticated
- `409 Conflict` — User already in circle

---

#### GET /circles/:id

Get circle details (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Friends Fund",
  "organizerAddress": "GXXXXXX...",
  "status": "ACTIVE",
  "contributionAmount": 100,
  "escrowAsset": "native",
  "cycleLengthDays": 30,
  "totalMembers": 3,
  "currentCycle": 1,
  "members": [
    {
      "walletAddress": "GAAAA...",
      "displayName": "Alice",
      "payoutPosition": 0,
      "securityDepositPaid": true,
      "joinedAt": "2026-01-15T10:30:00Z"
    },
    {
      "walletAddress": "GBBBB...",
      "displayName": "Bob",
      "payoutPosition": 1,
      "securityDepositPaid": false,
      "joinedAt": "2026-01-15T10:31:00Z"
    }
  ],
  "cycles": [
    {
      "cycleIndex": 0,
      "recipientAddress": "GAAAA...",
      "deadline": "2026-02-14T10:30:00Z",
      "status": "OPEN",
      "contributions": [
        {
          "memberAddress": "GBBBB...",
          "amount": 100,
          "asset": "native",
          "paidAt": "2026-01-20T15:00:00Z",
          "isOnTime": true
        }
      ]
    }
  ],
  "createdAt": "2026-01-15T10:30:00Z"
}
```

**Errors:**
- `404 Not Found` — Circle not found
- `401 Unauthorized` — Not a member

---

#### POST /circles/:id/start

Start circle after all members funded (organizer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "currentCycle": 0,
  "contractId": "CAUOI...HWVUQ",
  "message": "Circle started successfully"
}
```

**Errors:**
- `400 Bad Request` — Not all members funded
- `401 Unauthorized` — Not organizer
- `404 Not Found` — Circle not found

---

#### GET /circles/join/:code

Preview circle before joining (no auth required).

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Friends Fund",
  "organizerAddress": "GXXXXXX...",
  "status": "PENDING",
  "contributionAmount": 100,
  "totalMembers": 3,
  "currentMembers": 2,
  "cycleLengthDays": 30
}
```

**Errors:**
- `404 Not Found` — Invite code not found
- `410 Gone` — Circle already started (no new joins)

---

#### POST /circles/join/:code

Join circle via invite code (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Friends Fund",
  "status": "PENDING",
  "payoutPosition": 2,
  "message": "Successfully joined circle"
}
```

**Errors:**
- `400 Bad Request` — User already a member
- `404 Not Found` — Invite code not found
- `410 Gone` — Circle already started

---

### Contributions

#### POST /circles/:id/contribute/prepare

Get unsigned XDR for contribution transaction (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "xdr": "AAAAAgAAAABu39...",
  "signingKey": "GXXXXXX...",
  "memo": "Cycle 1 contribution to Friends Fund"
}
```

**Frontend workflow:**
1. Receive unsigned XDR
2. Sign with Freighter wallet
3. Send signed XDR to `/contribute/submit`

---

#### POST /circles/:id/contribute/submit

Submit signed contribution transaction (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "signedXdr": "AAAAAgAAAABu39...",
  "cycleIndex": 0
}
```

**Response (200 OK):**
```json
{
  "transactionHash": "abc123def456...",
  "amount": 100,
  "asset": "native",
  "status": "SUBMITTED",
  "message": "Contribution submitted successfully"
}
```

**Polling for completion:**
```bash
# Poll this endpoint every 5 seconds for up to 30 seconds
GET /circles/:id/cycle/:cycleIndex/status
```

Response once settled:
```json
{
  "status": "SUCCESS",
  "transactionHash": "abc123def456...",
  "ledger": 12345,
  "disbursed": true
}
```

**Errors:**
- `400 Bad Request` — Already contributed in this cycle
- `401 Unauthorized` — Not a member
- `404 Not Found` — Cycle or circle not found
- `409 Conflict` — Cycle not open

---

### Reputation

#### GET /reputation/:walletAddress

Get reputation profile (public, no auth required).

**Response (200 OK):**
```json
{
  "walletAddress": "GXXXXXX...",
  "tier": "BRONZE",
  "score": 750,
  "circlesCompleted": 2,
  "totalOnTime": 12,
  "totalLate": 1,
  "totalDefaulted": 0,
  "onTimePercentage": 92.3,
  "joinedAt": "2025-12-01T08:00:00Z"
}
```

**Tiers:**
- `NEW` — 0-199 (no circles completed)
- `BRONZE` — 200-499 (1+ circle)
- `SILVER` — 500-699 (3+ circles)
- `GOLD` — 700-899 (5+ circles)
- `PLATINUM` — 900-1000 (10+ circles, 95%+ on-time)

**Errors:**
- `404 Not Found` — User not found

---

### Anchors

#### GET /anchors

List supported Stellar anchors for deposits (no auth required).

**Response (200 OK):**
```json
{
  "anchors": [
    {
      "name": "Test Anchor",
      "domain": "testanchor.stellar.org",
      "supportedAssets": ["USD", "EUR", "GBP"],
      "sepUrl": "https://testanchor.stellar.org/.well-known/stellar.toml",
      "transferServer": "https://testanchor.stellar.org/transactions/deposit/interactive"
    }
  ]
}
```

---

#### POST /anchors/deposit-url

Get SEP-24 interactive deposit URL (auth required).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "anchorDomain": "testanchor.stellar.org",
  "assetCode": "USD",
  "amount": 100,
  "circleId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "interactiveUrl": "https://testanchor.stellar.org/...?token=...",
  "walletAccountId": "GXXXXXX..."
}
```

**Errors:**
- `400 Bad Request` — Invalid anchor or asset
- `404 Not Found` — Anchor not found

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": {
    "field": "fieldName",
    "message": "Validation error"
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created |
| `400` | Bad Request — Validation failed |
| `401` | Unauthorized — Not authenticated |
| `403` | Forbidden — Don't have permission |
| `404` | Not Found — Resource not found |
| `409` | Conflict — Resource conflict (e.g., duplicate) |
| `500` | Internal Server Error — Server error |

---

## Rate Limiting

- **Free tier:** 60 requests per minute per IP
- **Authenticated:** 300 requests per minute per user
- **Headers:**
  ```
  X-RateLimit-Limit: 300
  X-RateLimit-Remaining: 299
  X-RateLimit-Reset: 1234567890
  ```

---

## Versioning

Current API version: **v1** (in URL: `/api/v1/...`)

Breaking changes will increment the version. Old versions supported for 6 months.

---

## Webhooks (Future)

Planned webhook events:
- `circle.created`
- `circle.started`
- `contribution.submitted`
- `cycle.disbursed`
- `user.reputation.updated`

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
});

// 1. Get challenge
const { data: challenge } = await api.post('/auth/challenge', {
  walletAddress: 'GXXXXXX...'
});

// 2. Sign with Freighter (pseudo-code)
const signature = await freighter.signTransaction(challenge.nonce);

// 3. Verify
const { data: auth } = await api.post('/auth/verify', {
  walletAddress: 'GXXXXXX...',
  signature,
  nonce: challenge.nonce
});

// 4. Set token for future requests
api.defaults.headers.Authorization = `Bearer ${auth.token}`;

// 5. Get circles
const { data: circles } = await api.get('/circles');
```

### Python

```python
import requests

base_url = "http://localhost:3001/api"

# 1. Get challenge
resp = requests.post(f"{base_url}/auth/challenge", json={
    "walletAddress": "GXXXXXX..."
})
nonce = resp.json()["nonce"]

# 2. Sign with wallet (pseudo-code)
signature = sign_with_wallet(nonce)

# 3. Verify
resp = requests.post(f"{base_url}/auth/verify", json={
    "walletAddress": "GXXXXXX...",
    "signature": signature,
    "nonce": nonce
})
token = resp.json()["token"]

# 4. Get circles
headers = {"Authorization": f"Bearer {token}"}
resp = requests.get(f"{base_url}/circles", headers=headers)
circles = resp.json()["circles"]
```

### cURL

```bash
# 1. Get challenge
curl -X POST http://localhost:3001/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"GXXXXXX..."}'

# Response: {"nonce":"aabbccdd...","ttl":300}

# 2. Verify (after signing)
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress":"GXXXXXX...",
    "signature":"base64_signature",
    "nonce":"aabbccdd..."
  }'

# Response: {"token":"eyJhbGci..."}

# 3. Get circles
curl -X GET http://localhost:3001/api/circles \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/diasporacircle/issues)
- **Email:** api-support@diasporacircle.dev

---

**Last Updated:** 2026-07-10
