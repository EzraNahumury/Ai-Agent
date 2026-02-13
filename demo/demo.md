# Demo

## Prereq

- Use the default x402-stacks facilitator (`https://x402-backend-7eby.onrender.com`) or run your own at `FACILITATOR_URL`.
- Fund the sender address for testnet or mainnet.

## Run

1) Copy env files
   - `cp .env.example .env`
   - `cp apps/web/.env.local.example apps/web/.env.local`

2) Fill env values
   - `STACKS_PRIVATE_KEY`
   - `STACKS_RECIPIENT_ADDRESS`
   - `STACKS_NETWORK`
   - `FACILITATOR_URL`

3) Install deps
   - `npm install`

4) Start server
   - `npm run dev:server`

5) Start web UI (optional)
   - `npm run dev:web`

6) Run agent CLI
   - `npm run agent -- -q "climate tech"`

## Sample CLI Output

```
Logs:
[2026-02-10T02:50:00.000Z] Requesting premium search...
[2026-02-10T02:50:00.200Z] 402 received. Payment required.
[2026-02-10T02:50:01.000Z] Paying...
[2026-02-10T02:50:02.100Z] Retrying...
[2026-02-10T02:50:02.400Z] Retrying premium search...
[2026-02-10T02:50:02.600Z] Success 200 OK

Results:
1. Climate tech funding tracker 2026
   https://example.com/climate-tech-funding
   A rolling tracker of recent climate tech rounds and lead investors.
...

Summary:
- Climate tech funding tracker 2026 - https://example.com/climate-tech-funding
...

Insights:
- Common themes: climate, tech, funding.
- Total results: 10.
- Coverage spans funding, infrastructure, and deployment topics.
```

## Legacy 402 JSON (for milestone 1/2)

Set:
- `ALLOW_DUMMY_PAYMENT=true`
- `LEGACY_JSON_402=true`

Then test:
- `curl http://localhost:4000/premium/search?q=climate`
- `curl -H "X-Payment-Proof: dummy" http://localhost:4000/premium/search?q=climate`
