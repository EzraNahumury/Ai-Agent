# Autonomous AI Agent x402-Stacks

## Ringkasan

Proyek ini mendemonstrasikan sebuah **AI agent otonom** yang mampu mengakses **resource premium** di web dengan melakukan **pembayaran otomatis** menggunakan standar **x402** yang diimplementasikan di atas **blockchain Stacks**.

Agent ini menggunakan **HTTP 402 (Payment Required)** secara natural. Ketika sebuah request ditolak karena belum dibayar, agent akan:

1. membaca instruksi pembayaran,
2. melakukan micropayment via x402-stacks,
3. mengulang request dengan bukti pembayaran,
4. lalu melanjutkan reasoning tanpa campur tangan manusia.

Proyek ini menunjukkan konsep **machine-to-machine payment** sebagai primitive web.

---

## Latar Belakang Masalah

Banyak API, dataset, dan konten premium saat ini dimonetisasi menggunakan:

* akun pengguna
* API key
* langganan
* billing terpusat

Model tersebut tidak cocok untuk **AI agent otonom**, yang seharusnya dapat:

* mengakses resource secara mandiri,
* membayar per request,
* dan bekerja tanpa identitas pengguna.

---

## Solusi

Dengan **x402-stacks**, pembayaran dijadikan bagian dari **alur HTTP**.

Alih-alih login atau subscription:

1. Server mengembalikan **HTTP 402 Payment Required**
2. Client (agent) membaca instruksi pembayaran dari response
3. Agent membuat & menandatangani transaksi STX secara otomatis
4. Request diulang dengan bukti pembayaran
5. Server memverifikasi pembayaran via facilitator
6. Resource premium dikirim ke agent

Semua terjadi di level protokol, tanpa campur tangan manusia.

---

## Arsitektur Sistem

```
Pengguna (Web UI / CLI)
   |
   v
AI Agent (@x402/agent)
   - Menerima query
   - Memanggil premium API via x402Fetch
   - Merangkum hasil via LLM (Gemini/OpenAI) atau heuristik
   |
   v
x402 HTTP Client (x402-stacks)
   - Mendeteksi HTTP 402
   - Membuat transaksi STX
   - Retry request dengan bukti pembayaran
   |
   v
Premium API Server (@x402/server)
   - /premium/search  --> dilindungi paymentMiddleware (HTTP 402)
   - /facilitator/*   --> verify & settle pembayaran on-chain
   |
   v
Blockchain Stacks (testnet / mainnet)
```

---

## Struktur Monorepo

```
x402-stacks-hackathon/
|-- apps/
|   |-- server/src/
|   |   |-- index.ts              # Express server (port 4000)
|   |   |-- premiumRoutes.ts      # GET /premium/search (dilindungi 402)
|   |   |-- paymentMiddleware.ts  # x402-stacks payment middleware
|   |   |-- facilitatorRoutes.ts  # /facilitator/verify & /facilitator/settle
|   |-- web/
|       |-- app/page.tsx          # Next.js UI (port 3000)
|       |-- app/api/agent/route.ts # API route yang memanggil runAgent()
|
|-- packages/
|   |-- agent/src/
|       |-- index.ts              # runAgent() - logika utama agent
|       |-- x402Client.ts         # x402Fetch() - HTTP client dengan auto-pay
|       |-- cli.ts                # CLI runner
|
|-- DAFTAR-API-LOKAL-INDONESIA-master/
|   |-- data/                     # Dataset API lokal Indonesia (sumber data premium)
|
|-- .env.example
|-- package.json
```

---

## Flow Lengkap

```
1. User mengetik query di Web UI (atau CLI)
        |
2. POST /api/agent { query: "shopee" }
        |
3. runAgent() dipanggil
        |
4. x402Fetch("http://localhost:4000/premium/search?q=shopee")
        |
5. Server menerima request --> paymentMiddleware mengembalikan HTTP 402
        |
6. x402-stacks client otomatis:
   a. Membaca payment requirements dari header 402
   b. Membuat transaksi STX (privateKeyToAccount + sign)
   c. Mengirim ke facilitator untuk di-settle
   d. Retry request dengan bukti pembayaran di header
        |
7. Server memverifikasi pembayaran --> 200 OK + data premium
        |
8. Agent memproses hasil:
   - Merangkum via LLM (Gemini/OpenAI) jika API key tersedia
   - Fallback ke heuristik jika tidak ada LLM
        |
9. Hasil dikembalikan ke user (summary + bullets + insights)
```

---

## Bukti Pembayaran On-Chain (Testnet)

Berikut contoh transaksi **nyata** yang terjadi saat agent mengakses premium data:

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

Verifikasi di Stacks Explorer:
`https://explorer.hiro.so/txid/0x5598e13d5a9325e064e237da15b99701ba20c230d106b3258f138c459c48575c?chain=testnet`

Setiap kali agent menjalankan query, pembayaran **benar-benar terjadi on-chain**:
- **0.001 STX** dikirim ke pemilik resource premium
- **~0.002 STX** sebagai fee blockchain
- Total **~0.003 STX per request**

---

## Dataset & Keyword Pencarian

Data premium bersumber dari **DAFTAR-API-LOKAL-INDONESIA** yang berisi 200+ API lokal Indonesia. Berikut keyword yang bisa digunakan untuk pencarian:

### E-Commerce & Finansial
| Keyword | Contoh Hasil |
|---------|-------------|
| `shopee` | Shopee API |
| `tokopedia` | Tokopedia.com API |
| `lazada` | Lazada API |
| `blibli` | Blibli API |
| `midtrans` | Midtrans Payment Gateway |
| `xendit` | Xendit API |
| `dana` | Dana Enterprise |
| `ovo` | OVO Unofficial |
| `doku` | DOKU Payment |
| `saham` | API Data Saham Indonesia |
| `emas` | API Harga Emas/Logam Mulia |
| `bca` | BCA API |
| `paypal` | Paypal |
| `crypto` | Indodax, Binance, TokoCrypto |

### Pendidikan
| Keyword | Contoh Hasil |
|---------|-------------|
| `kbbi` | KBBI API, KBBI Daring, New KBBI API |
| `sekolah` | API Data Sekolah Indonesia |
| `wikipedia` | Wikipedia API |
| `sunda` | Hibersunda Undak Usuk Basa Sunda |

### Hiburan & Media
| Keyword | Contoh Hasil |
|---------|-------------|
| `anime` | AnimeAPI, Otakudesu, Katanime |
| `game` | Epic Free Games, ID Game Checker |
| `film` | FILMAPIK API, LK21 API |
| `manga` | Manga/Komik Bahasa Indonesia |
| `musik` | Spotify, Deezer, SoundCloud |
| `quotes` | Quotes Generator API |
| `dota` | Strygwyr Dota 2 API |
| `sepak bola` | Klasemen Sepak Bola, Liga Indonesia |

### Berita
| Keyword | Contoh Hasil |
|---------|-------------|
| `berita` | API Berita Indonesia, Berita Indo API |
| `cnn` | CNN Indonesia |
| `detik` | Detik News API |

### Lokasi & Pemerintahan
| Keyword | Contoh Hasil |
|---------|-------------|
| `wilayah` | API Wilayah Indonesia |
| `kode pos` | Kode Pos Indonesia |
| `provinsi` | Nama Provinsi Seluruh Indonesia |
| `kereta` | Daftar Stasiun Kereta Api |
| `bmkg` | Data BMKG |
| `gempa` | Info Gempa & Cuaca API |
| `batik` | Batik Indonesia |
| `pesantren` | Pesantren se Indonesia |

### Agama Islam
| Keyword | Contoh Hasil |
|---------|-------------|
| `quran` | Al-Qur'an Indonesia, Quran API |
| `hadith` | Hadith API |
| `sholat` | Jadwal Sholat, Waktu Sholat API |
| `doa` | Doa Doa API |
| `puasa` | Puasa Sunnah API |

### Utilitas & Cuaca
| Keyword | Contoh Hasil |
|---------|-------------|
| `cuaca` | API Cuaca Realtime, BMKG Cuaca |
| `bank` | Daftar Nama Bank di Indonesia |
| `pengiriman` | JNE, J&T, Cek Resi |
| `whatsapp` | Whatsapp Cloud API |
| `twitter` | Twitter Trends |
| `youtube` | Unofficial Youtube API |
| `google` | Google Trends, Google Playstore |
| `covid` | Data COVID-19 di Indonesia |
| `rumah sakit` | Ketersediaan Kamar RS |

### Lainnya
| Keyword | Contoh Hasil |
|---------|-------------|
| `alkitab` | Alkitab API |
| `masak` | Masak Apa (resep) |
| `buku` | Bukuacak, Gramedia Ebooks |

> **Tip:** Gunakan keyword satu kata untuk hasil terbaik. Contoh: `shopee`, `cuaca`, `quran`, `anime`, `berita`.

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd Autonomous-AI-Agent
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

Isi variabel berikut di `.env`:

| Variable | Keterangan |
|----------|-----------|
| `STACKS_PRIVATE_KEY` | Private key pengirim (hex) |
| `STACKS_RECIPIENT_ADDRESS` | Alamat STX penerima pembayaran |
| `STACKS_NETWORK` | `testnet` (default) atau `mainnet` |
| `PRICE_USTX` | Harga per request dalam microSTX (default: 1000) |
| `FACILITATOR_URL` | URL facilitator (default: `http://localhost:4000/facilitator`) |
| `LLM_PROVIDER` | `gemini`, `openai`, atau `none` |
| `GEMINI_API_KEY` | API key Gemini (opsional, untuk AI summary) |
| `OPENAI_API_KEY` | API key OpenAI (opsional, untuk AI summary) |
| `LOCAL_API_LOCALE` | `id` (default) atau `en` |

### 3. Jalankan

```bash
# Jalankan server + web sekaligus
npm run dev

# Atau jalankan terpisah:
npm run dev:server   # Server di http://localhost:4000
npm run dev:web      # Web UI di http://localhost:3000
```

### 4. Gunakan

**Via Web UI:**
Buka `http://localhost:3000`, ketik query (misal: `shopee`), klik kirim.

**Via CLI:**
```bash
npm run agent -- -q "shopee"
npm run agent -- -q "cuaca"
npm run agent -- -q "quran"
```

---

## Deployment (Render + Vercel)

Arsitektur deployment:

```
Vercel (Next.js Web UI)           Render (Express Server)
  https://your-app.vercel.app       https://your-server.onrender.com
  /api/agent  ──────────────────>   /premium/search (HTTP 402)
                                    /facilitator/* (verify & settle)
                                    /health
```

### A. Deploy Server ke Render

1. Push repo ke GitHub
2. Buka [render.com](https://render.com), buat **Web Service** baru
3. Connect repo GitHub
4. Konfigurasi:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `apps/server` |
   | **Build Command** | `cd ../.. && npm install && npm run build -w @x402/server` |
   | **Start Command** | `cd ../.. && npm run start -w @x402/server` |
   | **Environment** | `Node` |

5. Tambahkan **Environment Variables** di Render:

   | Variable | Value |
   |----------|-------|
   | `STACKS_NETWORK` | `testnet` |
   | `STACKS_RECIPIENT_ADDRESS` | alamat STX penerima |
   | `PRICE_USTX` | `1000` |
   | `FACILITATOR_URL` | `https://your-server.onrender.com/facilitator` |
   | `PAYMENT_MEMO` | `x402 payment` |

6. Deploy. Catat URL server (misal: `https://x402-server-xxxx.onrender.com`)

### B. Deploy Web ke Vercel

1. Buka [vercel.com](https://vercel.com), import repo GitHub yang sama
2. Konfigurasi:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `apps/web` |
   | **Framework Preset** | `Next.js` (otomatis terdeteksi) |
   | **Install Command** | `npm install --prefix ../..` |

3. Tambahkan **Environment Variables** di Vercel:

   | Variable | Value |
   |----------|-------|
   | `SERVER_BASE_URL` | `https://x402-server-xxxx.onrender.com` (URL Render) |
   | `STACKS_PRIVATE_KEY` | private key hex pengirim |
   | `STACKS_NETWORK` | `testnet` |
   | `LLM_PROVIDER` | `gemini` atau `openai` atau `none` |
   | `GEMINI_API_KEY` | API key Gemini (opsional) |
   | `AGENT_TIMEOUT_MS` | `120000` |
   | `LOCAL_API_LOCALE` | `id` |

4. Deploy.

> **Penting:** `FACILITATOR_URL` di Render harus mengarah ke URL Render itu sendiri (self-referencing), karena facilitator berjalan di server yang sama.

---

## Catatan

- Jika tidak ada LLM API key, agent menggunakan **heuristik** untuk merangkum hasil.
- Testnet menggunakan `https://api.testnet.hiro.so` secara default.
- Untuk mainnet, set `STACKS_NETWORK=mainnet` dan pastikan alamat pengirim memiliki saldo STX.
- Dataset premium bersumber dari proyek open-source [DAFTAR-API-LOKAL-INDONESIA](https://github.com/farizdotid/DAFTAR-API-LOKAL-INDONESIA).
- Render free tier memiliki cold start ~30 detik saat idle. Request pertama mungkin lambat.

---

## x402 Compliance

| x402 Requirement | Status | Detail |
|------------------|--------|--------|
| **HTTP 402 Payment Required** | Terpenuhi | Server mengembalikan 402 via `paymentMiddleware` dari `x402-stacks` |
| **Pembayaran on-chain (Stacks)** | Terpenuhi | TX `0x5598e13d...` → status: `success` di Stacks testnet |
| **STX benar-benar terpotong** | Terpenuhi | Saldo turun 0.5 → 0.4967 STX setelah request |
| **Auto-pay tanpa intervensi manusia** | Terpenuhi | `x402Fetch()` otomatis detect 402 → sign → pay → retry |
| **Facilitator verify & settle** | Terpenuhi | `/facilitator/verify` + `/facilitator/settle` broadcast ke blockchain |
| **Library x402-stacks** | Terpenuhi | Dipakai di server (`paymentMiddleware`) dan agent (`createPaymentClient`) |
| **Functional MVP** | Terpenuhi | Server + Agent CLI + Web UI semua berjalan |

### Flow x402 yang Terjadi

```
Agent request GET /premium/search?q=shopee
       ↓
Server: 402 Payment Required (x402-stacks middleware)
       ↓
Agent: baca payment requirements dari header
       ↓
Agent: buat STX transfer tx, sign dengan private key
       ↓
Facilitator /settle: broadcast tx ke Stacks testnet → txid
       ↓
Agent: retry request + bukti pembayaran
       ↓
Server: verifikasi → 200 OK + data premium
       ↓
Blockchain: 1,000 uSTX transferred ✓
```

---

## Kesesuaian dengan Hackathon x402 Stacks Challenge

* Menggunakan **x402-stacks** untuk pembayaran otomatis
* Menggunakan **HTTP 402** secara natural sebagai sinyal ekonomi
* Pembayaran **benar-benar terjadi on-chain** di Stacks testnet (terverifikasi via explorer)
* MVP fungsional (server + agent CLI + web UI)
* Open-source
* Menunjukkan use case nyata: **AI agent yang membayar sendiri untuk mengakses data premium**

---

> Sebuah AI agent otonom yang dapat membayar sendiri untuk mengakses resource premium menggunakan HTTP 402 dan x402-stacks, mendemonstrasikan pembayaran machine-to-machine sebagai primitive web.
