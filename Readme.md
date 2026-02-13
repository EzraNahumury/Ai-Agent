# Autonomous AI Agent x402-Stacks

## Live Demo

| Service | URL |
|---------|-----|
| **Web UI** | [https://autonomus-ai.vercel.app](https://autonomus-ai.vercel.app) |
| **API Server** | [https://x402web-production.up.railway.app](https://x402web-production.up.railway.app) |

---

## Summary

This project demonstrates an **autonomous AI agent** that accesses **premium resources** on the web by performing **automatic payments** using the **x402** standard implemented on the **Stacks blockchain**.

The agent uses **HTTP 402 (Payment Required)** naturally. When a request is rejected due to unpaid access, the agent will:

1. Read the payment instructions,
2. Perform a micropayment via x402-stacks,
3. Retry the request with payment proof,
4. Continue reasoning without human intervention.

This project showcases the concept of **machine-to-machine payment** as a web primitive.

---

## Problem Statement

Many APIs, datasets, and premium content are currently monetized using:

* User accounts
* API keys
* Subscriptions
* Centralized billing

These models are not suitable for **autonomous AI agents**, which should be able to:

* Access resources independently,
* Pay per request,
* Operate without user identity.

---

## Solution

With **x402-stacks**, payment becomes part of the **HTTP flow**.

Instead of login or subscription:

1. Server returns **HTTP 402 Payment Required**
2. Client (agent) reads payment instructions from the response
3. Agent creates & signs an STX transaction automatically
4. Request is retried with payment proof
5. Server verifies payment via facilitator
6. Premium resource is delivered to the agent

Everything happens at the protocol level, without human intervention.

---

## System Architecture

```
User (Web UI / CLI)
   |
   v
AI Agent (@x402/agent)
   - Receives query
   - Calls premium API via x402Fetch
   - Summarizes results via LLM (Gemini/OpenAI) or heuristic
   |
   v
x402 HTTP Client (x402-stacks)
   - Detects HTTP 402
   - Creates STX transaction
   - Retries request with payment proof
   |
   v
Premium API Server (@x402/server)
   - /premium/search  --> protected by paymentMiddleware (HTTP 402)
   - /facilitator/*   --> verify & settle payments on-chain
   |
   v
Stacks Blockchain (testnet / mainnet)
```

---

## Monorepo Structure

```
x402-stacks-hackathon/
|-- apps/
|   |-- server/src/
|   |   |-- index.ts              # Express server (port 4000)
|   |   |-- premiumRoutes.ts      # GET /premium/search (protected by 402)
|   |   |-- paymentMiddleware.ts  # x402-stacks payment middleware
|   |   |-- facilitatorRoutes.ts  # /facilitator/verify & /facilitator/settle
|   |-- web/
|       |-- app/page.tsx          # Next.js UI (port 3000)
|       |-- app/api/agent/route.ts # API route that calls runAgent()
|
|-- packages/
|   |-- agent/src/
|       |-- index.ts              # runAgent() - main agent logic
|       |-- x402Client.ts         # x402Fetch() - HTTP client with auto-pay
|       |-- cli.ts                # CLI runner
|
|-- DAFTAR-API-LOKAL-INDONESIA-master/
|   |-- data/                     # Local Indonesian API dataset (premium data source)
|
|-- railway.json                  # Railway deployment config
|-- .env.example
|-- package.json
```

---

## Complete Flow

```
1. User types a query in Web UI (or CLI)
        |
2. POST /api/agent { query: "shopee" }
        |
3. runAgent() is called
        |
4. x402Fetch("https://x402web-production.up.railway.app/premium/search?q=shopee")
        |
5. Server receives request --> paymentMiddleware returns HTTP 402
        |
6. x402-stacks client automatically:
   a. Reads payment requirements from 402 headers
   b. Creates STX transaction (privateKeyToAccount + sign)
   c. Sends to facilitator for settlement
   d. Retries request with payment proof in header
        |
7. Server verifies payment --> 200 OK + premium data
        |
8. Agent processes results:
   - Summarizes via LLM (Gemini/OpenAI) if API key is available
   - Falls back to heuristic if no LLM configured
        |
9. Results returned to user (summary + bullets + insights)
```

---

## On-Chain Payment Proof (Testnet)

Here is an example of a **real transaction** that occurred when the agent accessed premium data:

```
Transaction:  0x5598e13d5a9325e064e237da15b99701ba20c230d106b3258f138c459c48575c
Status:       success
Type:         token_transfer (STX)
Sender:       ST2R15GMDRZBJB26R94ZMAMG9SMTK3VZFX7VDCGXG  (agent)
Recipient:    ST1JKKKANCENCNQ6K5NWMKEEHY99HNYSFEJHMV4C    (premium server)
Amount:       1,000 uSTX (0.001 STX)
Fee:          2,277 uSTX (0.002277 STX)
Network:      Stacks Testnet
```

Verify on Stacks Explorer:
`https://explorer.hiro.so/txid/0x5598e13d5a9325e064e237da15b99701ba20c230d106b3258f138c459c48575c?chain=testnet`

Every time the agent runs a query, payment **actually happens on-chain**:
- **0.001 STX** sent to the premium resource owner
- **~0.002 STX** as blockchain fee
- Total **~0.003 STX per request**

---

## Dataset & Search Keywords

Premium data is sourced from **DAFTAR-API-LOKAL-INDONESIA**, containing 200+ local Indonesian APIs. Here are the keywords you can use for searching:

### E-Commerce & Financial
| Keyword | Example Results |
|---------|----------------|
| `shopee` | Shopee API |
| `tokopedia` | Tokopedia.com API |
| `lazada` | Lazada API |
| `blibli` | Blibli API |
| `midtrans` | Midtrans Payment Gateway |
| `xendit` | Xendit API |
| `dana` | Dana Enterprise |
| `ovo` | OVO Unofficial |
| `doku` | DOKU Payment |
| `saham` | Indonesia Stock Data API |
| `emas` | Gold/Precious Metal Price API |
| `bca` | BCA API |
| `paypal` | Paypal |
| `crypto` | Indodax, Binance, TokoCrypto |

### Education
| Keyword | Example Results |
|---------|----------------|
| `kbbi` | KBBI API, KBBI Daring, New KBBI API |
| `sekolah` | Indonesia School Data API |
| `wikipedia` | Wikipedia API |
| `sunda` | Hibersunda Undak Usuk Basa Sunda |

### Entertainment & Media
| Keyword | Example Results |
|---------|----------------|
| `anime` | AnimeAPI, Otakudesu, Katanime |
| `game` | Epic Free Games, ID Game Checker |
| `film` | FILMAPIK API, LK21 API |
| `manga` | Manga/Comics in Indonesian |
| `musik` | Spotify, Deezer, SoundCloud |
| `quotes` | Quotes Generator API |
| `dota` | Strygwyr Dota 2 API |
| `sepak bola` | Football Standings, Indonesian League |

### News
| Keyword | Example Results |
|---------|----------------|
| `berita` | Indonesia News API, Berita Indo API |
| `cnn` | CNN Indonesia |
| `detik` | Detik News API |

### Location & Government
| Keyword | Example Results |
|---------|----------------|
| `wilayah` | Indonesia Region API |
| `kode pos` | Indonesia Postal Code |
| `provinsi` | All Indonesian Provinces |
| `kereta` | Train Station List |
| `bmkg` | BMKG Data |
| `gempa` | Earthquake & Weather API |
| `batik` | Indonesian Batik |
| `pesantren` | Islamic Boarding Schools in Indonesia |

### Islamic
| Keyword | Example Results |
|---------|----------------|
| `quran` | Al-Qur'an Indonesia, Quran API |
| `hadith` | Hadith API |
| `sholat` | Prayer Schedule API |
| `doa` | Dua/Prayer API |
| `puasa` | Sunnah Fasting API |

### Utilities & Weather
| Keyword | Example Results |
|---------|----------------|
| `cuaca` | Realtime Weather API, BMKG Weather |
| `bank` | List of Banks in Indonesia |
| `pengiriman` | JNE, J&T, Track Shipment |
| `whatsapp` | Whatsapp Cloud API |
| `twitter` | Twitter Trends |
| `youtube` | Unofficial Youtube API |
| `google` | Google Trends, Google Playstore |
| `covid` | COVID-19 Data in Indonesia |
| `rumah sakit` | Hospital Room Availability |

### Others
| Keyword | Example Results |
|---------|----------------|
| `alkitab` | Bible API |
| `masak` | Masak Apa (recipes) |
| `buku` | Bukuacak, Gramedia Ebooks |

> **Tip:** Use single-word keywords for best results. Example: `shopee`, `cuaca`, `quran`, `anime`, `berita`.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/EzraNahumury/Ai-Agent.git
cd Ai-Agent
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in the following variables in `.env`:

| Variable | Description |
|----------|-------------|
| `STACKS_PRIVATE_KEY` | Sender private key (hex) |
| `STACKS_RECIPIENT_ADDRESS` | STX recipient address for payments |
| `STACKS_NETWORK` | `testnet` (default) or `mainnet` |
| `PRICE_USTX` | Price per request in microSTX (default: 1000) |
| `FACILITATOR_URL` | Facilitator URL (default: `http://localhost:4000/facilitator`) |
| `LLM_PROVIDER` | `gemini`, `openai`, or `none` |
| `GEMINI_API_KEY` | Gemini API key (optional, for AI summary) |
| `OPENAI_API_KEY` | OpenAI API key (optional, for AI summary) |
| `LOCAL_API_LOCALE` | `id` (default) or `en` |

### 3. Run

```bash
# Run server + web simultaneously
npm run dev

# Or run separately:
npm run dev:server   # Server at http://localhost:4000
npm run dev:web      # Web UI at http://localhost:3000
```

### 4. Use

**Via Web UI:**
Open `http://localhost:3000`, type a query (e.g., `shopee`), click submit.

**Via CLI:**
```bash
npm run agent -- -q "shopee"
npm run agent -- -q "cuaca"
npm run agent -- -q "quran"
```

---

## Deployment (Railway + Vercel)

Deployment architecture:

```
Vercel (Next.js Web UI)                   Railway (Express Server)
  https://autonomus-ai.vercel.app          https://x402web-production.up.railway.app
  /api/agent  ─────────────────────>       /premium/search (HTTP 402)
                                           /facilitator/* (verify & settle)
                                           /health
```

### A. Deploy Server to Railway

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app), create a **New Project**
3. Connect your GitHub repo
4. Railway auto-detects `railway.json` with build/start commands
5. Add **Environment Variables** in Railway:

   | Variable | Value |
   |----------|-------|
   | `STACKS_NETWORK` | `testnet` |
   | `STACKS_PRIVATE_KEY` | sender private key (hex) |
   | `STACKS_RECIPIENT_ADDRESS` | STX recipient address |
   | `PRICE_USTX` | `1000` |
   | `FACILITATOR_URL` | `https://<your-railway-url>/facilitator` |
   | `PAYMENT_MEMO` | `x402 payment` |
   | `LLM_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | your Gemini API key |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |

6. Deploy. Note the server URL (e.g., `https://x402web-production.up.railway.app`)

> **Important:** `FACILITATOR_URL` must point to the Railway URL itself (self-referencing), because the facilitator runs on the same server.

### B. Deploy Web to Vercel

1. Go to [vercel.com](https://vercel.com), import the same GitHub repo
2. Configuration:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `apps/web` |
   | **Framework Preset** | `Next.js` (auto-detected) |
   | **Install Command** | `npm install --prefix ../..` |

3. Add **Environment Variables** in Vercel:

   | Variable | Value |
   |----------|-------|
   | `SERVER_BASE_URL` | `https://x402web-production.up.railway.app` |
   | `STACKS_PRIVATE_KEY` | sender private key (hex) |
   | `STACKS_NETWORK` | `testnet` |
   | `LLM_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | your Gemini API key |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `AGENT_TIMEOUT_MS` | `120000` |

4. Deploy.

---

## Notes

- If no LLM API key is configured, the agent uses a **heuristic** to summarize results.
- Testnet uses `https://api.testnet.hiro.so` by default.
- For mainnet, set `STACKS_NETWORK=mainnet` and ensure the sender address has STX balance.
- Premium dataset is sourced from the open-source project [DAFTAR-API-LOKAL-INDONESIA](https://github.com/farizdotid/DAFTAR-API-LOKAL-INDONESIA).
- Railway free tier may have cold starts when idle. The first request may be slower.

---

## x402 Compliance

| x402 Requirement | Status | Detail |
|------------------|--------|--------|
| **HTTP 402 Payment Required** | Fulfilled | Server returns 402 via `paymentMiddleware` from `x402-stacks` |
| **On-chain payment (Stacks)** | Fulfilled | TX `0x5598e13d...` -> status: `success` on Stacks testnet |
| **STX actually deducted** | Fulfilled | Balance dropped 0.5 -> 0.4967 STX after request |
| **Auto-pay without human intervention** | Fulfilled | `x402Fetch()` auto detects 402 -> sign -> pay -> retry |
| **Facilitator verify & settle** | Fulfilled | `/facilitator/verify` + `/facilitator/settle` broadcast to blockchain |
| **x402-stacks library** | Fulfilled | Used in server (`paymentMiddleware`) and agent (`createPaymentClient`) |
| **Functional MVP** | Fulfilled | Server + Agent CLI + Web UI all working |

### x402 Flow in Action

```
Agent request GET /premium/search?q=shopee
       |
Server: 402 Payment Required (x402-stacks middleware)
       |
Agent: reads payment requirements from header
       |
Agent: creates STX transfer tx, signs with private key
       |
Facilitator /settle: broadcasts tx to Stacks testnet -> txid
       |
Agent: retries request + payment proof
       |
Server: verifies -> 200 OK + premium data
       |
Blockchain: 1,000 uSTX transferred
```

---

## Hackathon x402 Stacks Challenge Compliance

* Uses **x402-stacks** for automatic payments
* Uses **HTTP 402** naturally as an economic signal
* Payments **actually happen on-chain** on Stacks testnet (verified via explorer)
* Functional MVP (server + agent CLI + web UI)
* Open-source
* Demonstrates a real use case: **an AI agent that pays for itself to access premium data**

---

## License

MIT

---

> An autonomous AI agent that pays for itself to access premium resources using HTTP 402 and x402-stacks, demonstrating machine-to-machine payment as a web primitive.
