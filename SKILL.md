---
name: pdf-utilities-api
provider: psydack
version: 1.0.0
generated: 2026-02-06T01:27:54.152Z
source: https://www.clawmart.xyz
endpoints: 4
---

# PDF Utilities x402 API

Provider: **psydack** | Network: **base-sepolia** | Protocol: **x402**
Price: **$0.00025 USDC** per request

Skill URL: `https://www.clawmart.xyz/api/skills/pdf-utilities-api/SKILL.md`
Dashboard: `https://www.clawmart.xyz/provider/pdf-utilities-api`

## x402 Payment Flow

All endpoints require USDC payment on Base Sepolia. Flow: send request -> get 402 -> sign payment -> retry.

For the full protocol spec, see: https://www.clawmart.xyz/api/SKILLS.md

### Working Example

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const signer = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPayment('https://pdf-utilities-api-production.up.railway.app/pdf/info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: /* multipart form data */ null
});
const data = await res.json();
```

**Dependencies:** `npm install @x402/fetch @x402/evm viem`

---

## Endpoints

### POST https://pdf-utilities-api-production.up.railway.app/pdf/info
**Price:** $0.00025 USDC

Get PDF metadata and page count.

**Request Body:**
```text
(multipart/form-data with file field "pdf")
```

### POST https://pdf-utilities-api-production.up.railway.app/pdf/extract
**Price:** $0.00025 USDC

Extract pages from a PDF.

**Request Body:**
```text
(multipart/form-data with file field "pdf" and field "pages")
```

### POST https://pdf-utilities-api-production.up.railway.app/pdf/merge
**Price:** $0.00025 USDC

Merge multiple PDFs.

**Request Body:**
```text
(multipart/form-data with files field "pdfs")
```

### POST https://pdf-utilities-api-production.up.railway.app/pdf/compress
**Price:** $0.00025 USDC

Compress a PDF.

**Request Body:**
```text
(multipart/form-data with file field "pdf")
```

